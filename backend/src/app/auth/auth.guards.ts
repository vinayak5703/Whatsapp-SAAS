import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../database/database.service';
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from './auth.decorators';
import { Permission } from './auth.types';
import { TenantRequest } from './tenant-context.middleware';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.user) throw new UnauthorizedException('A valid bearer token is required');
    return true;
  }
}

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.user?.tenantId || request.tenantId !== request.user.tenantId) {
      throw new ForbiddenException('A verified tenant context is required');
    }
    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly database: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      throw new ForbiddenException('Route is missing an explicit permission requirement');
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    if (!user) throw new UnauthorizedException();
    if (user.role === 'SUPER_ADMIN') return true;

    const hasAllPermissions = await this.database.withTenant(user.tenantId, async (client) => {
      const result = await client.query<{ granted_count: number }>(
        `SELECT count(DISTINCT permissions.permission_key)::int AS granted_count
         FROM user_roles
         JOIN roles ON roles.id = user_roles.role_id
         JOIN role_permissions ON role_permissions.role_id = roles.id
         JOIN permissions ON permissions.id = role_permissions.permission_id
         WHERE user_roles.tenant_id = $1
           AND user_roles.user_id = $2
           AND roles.role_key = $3
           AND permissions.permission_key = ANY($4::text[])`,
        [user.tenantId, user.sub, user.role, required],
      );
      return result.rows[0]?.granted_count === required.length;
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}