import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AccessTokenClaims, UserRole } from './auth.types';
import { RegisterDto } from './register.dto';
import { DatabaseService } from '../database/database.service';

interface RefreshClaims {
  sub: string;
  tenantId: string;
  tokenId: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AccessTokenClaims & { id: string; firstName: string; lastName: string; tenantSlug?: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      return await this.database.withTenant('system', async (client) => {
        const result = await client.query<{
          id: string;
          tenant_id: string;
          email: string;
          password_hash: string;
          first_name: string;
          last_name: string;
          role_key: UserRole;
        }>(
          `SELECT users.id, users.tenant_id, users.email, users.password_hash,
                  users.first_name, users.last_name, roles.role_key
           FROM users
           JOIN user_roles ON user_roles.user_id = users.id AND user_roles.tenant_id = users.tenant_id
           JOIN roles ON roles.id = user_roles.role_id
           WHERE lower(users.email) = lower($1)
             AND users.status = 'active' AND users.deleted_at IS NULL
           ORDER BY users.created_at DESC
           LIMIT 1`,
          [normalizedEmail],
        );

        const userRow = result.rows[0];
        if (!userRow) throw new UnauthorizedException('Invalid email or password');

        const isPasswordValid = await compare(password, userRow.password_hash);
        if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');

        const user = {
          sub: userRow.id,
          id: userRow.id,
          tenantId: userRow.tenant_id,
          email: userRow.email,
          firstName: userRow.first_name,
          lastName: userRow.last_name,
          role: userRow.role_key,
        };

        return this.createSession(client, user);
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException('User account could not be validated');
    }
  }

  async register(input: RegisterDto, request: Request): Promise<AuthSession> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check if email already exists in system
    try {
      const existingUser = await this.database.withTenant('system', async (client) => {
        const check = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL LIMIT 1`,
          [normalizedEmail],
        );
        return check.rows[0];
      });

      if (existingUser) {
        throw new ConflictException('This email is already registered. Please sign in instead or use another email address.');
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      // Continue if system tenant query or error
    }

    const tenantId = randomUUID();
    const userId = randomUUID();
    const tenantSlug = `${this.toSlug(input.businessName)}-${randomBytes(3).toString('hex')}`;
    const passwordHash = await hash(input.password, 12);

    try {
      return await this.database.withTenant(tenantId, async (client) => {
        await client.query(
          'INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3)',
          [tenantId, input.businessName, tenantSlug],
        );

        await client.query(
          `INSERT INTO users (id, tenant_id, name, email, password_hash, first_name, last_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            tenantId,
            `${input.firstName} ${input.lastName}`.trim(),
            normalizedEmail,
            passwordHash,
            input.firstName,
            input.lastName,
          ],
        );

        const roleResult = await client.query<{ id: string }>(
          'SELECT id FROM roles WHERE role_key = $1',
          ['TENANT_ADMIN'],
        );
        const roleId = roleResult.rows[0]?.id;
        if (!roleId) throw new ServiceUnavailableException('Database role migration is missing');

        await client.query(
          'INSERT INTO user_roles (tenant_id, user_id, role_id) VALUES ($1, $2, $3)',
          [tenantId, userId, roleId],
        );

        await client.query(
          `INSERT INTO audit_logs (tenant_id, actor_user_id, action, resource_type, resource_id, request_id, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tenantId, userId, 'auth.register', 'tenant', tenantId, request.header('x-request-id') ?? null, { email: normalizedEmail }],
        );

        const user = {
          sub: userId,
          id: userId,
          tenantId,
          tenantSlug,
          email: normalizedEmail,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'TENANT_ADMIN' as UserRole,
        };

        return this.createSession(client, user);
      });
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      const databaseError = error as { code?: string; message?: string };
      if (databaseError.code === '23505') {
        throw new ConflictException('This email is already registered. Please sign in instead or use another email address.');
      }
      if (error instanceof ServiceUnavailableException) throw error;
      if (databaseError.code || databaseError.message?.includes('SASL')) {
        throw new ServiceUnavailableException('Database connection or migrations are not ready');
      }
      throw error;
    }
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const claims = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    try {
      return await this.database.withTenant(claims.tenantId, async (client) => {
        const result = await client.query<{
          id: string;
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          role_key: UserRole;
        }>(
          `SELECT refresh_tokens.id, users.id AS user_id, users.email, users.first_name,
                  users.last_name, roles.role_key
           FROM refresh_tokens
           JOIN users ON users.id = refresh_tokens.user_id AND users.tenant_id = refresh_tokens.tenant_id
           JOIN user_roles ON user_roles.user_id = users.id AND user_roles.tenant_id = users.tenant_id
           JOIN roles ON roles.id = user_roles.role_id
           WHERE refresh_tokens.tenant_id = $1 AND refresh_tokens.user_id = $2
             AND refresh_tokens.id = $3 AND refresh_tokens.token_hash = $4
             AND refresh_tokens.revoked_at IS NULL AND refresh_tokens.expires_at > now()
             AND users.status = 'active' AND users.deleted_at IS NULL`,
          [claims.tenantId, claims.sub, claims.tokenId, tokenHash],
        );
        const current = result.rows[0];
        if (!current) throw new UnauthorizedException('Refresh session is invalid or expired');

        await client.query(
          'UPDATE refresh_tokens SET revoked_at = now() WHERE tenant_id = $1 AND id = $2',
          [claims.tenantId, current.id],
        );

        return this.createSession(client, {
          sub: current.user_id,
          id: current.user_id,
          tenantId: claims.tenantId,
          email: current.email,
          firstName: current.first_name,
          lastName: current.last_name,
          role: current.role_key,
        });
      });
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new ServiceUnavailableException('Could not refresh the database session');
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;

    try {
      const claims = await this.verifyRefreshToken(refreshToken);
      await this.database.withTenant(claims.tenantId, async (client) => {
        await client.query(
          `UPDATE refresh_tokens SET revoked_at = now()
           WHERE tenant_id = $1 AND user_id = $2 AND id = $3
             AND token_hash = $4 AND revoked_at IS NULL`,
          [claims.tenantId, claims.sub, claims.tokenId, this.hashToken(refreshToken)],
        );
      });
    } catch {
      return;
    }
  }

  private async createSession(
    client: import('pg').PoolClient,
    user: AuthSession['user'],
  ): Promise<AuthSession> {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!this.isUsableSecret(accessSecret) || !this.isUsableSecret(refreshSecret)) {
      throw new ServiceUnavailableException('Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET to different random values of at least 32 characters in the project-root .env');
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tokenId = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.sub, tenantId: user.tenantId, tokenId } satisfies RefreshClaims,
      { secret: refreshSecret, expiresIn: '7d' },
    );
    const accessToken = await this.jwt.signAsync(
      { sub: user.sub, tenantId: user.tenantId, role: user.role, email: user.email },
      {
        secret: accessSecret,
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as NonNullable<
          import('@nestjs/jwt').JwtModuleOptions['signOptions']
        >['expiresIn'],
      },
    );

    await client.query(
      `INSERT INTO refresh_tokens (id, tenant_id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenId, user.tenantId, user.sub, this.hashToken(refreshToken), expiresAt],
    );

    return { accessToken, refreshToken, user };
  }

  private async verifyRefreshToken(token: string): Promise<RefreshClaims> {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!this.isUsableSecret(secret)) {
      throw new ServiceUnavailableException('JWT_REFRESH_SECRET is not configured');
    }
    try {
      return await this.jwt.verifyAsync<RefreshClaims>(token, { secret });
    } catch {
      throw new UnauthorizedException('Refresh session is invalid or expired');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUsableSecret(secret?: string): secret is string {
    return Boolean(secret && secret.length >= 32 && !/(replace-with|change-me|your-secret|example)/i.test(secret));
  }

  private toSlug(value: string): string {
    return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'workspace';
  }
}