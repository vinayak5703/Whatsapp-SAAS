import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { AccessTokenClaims, USER_ROLES } from './auth.types';

export interface TenantRequest extends Request {
  user?: AccessTokenClaims;
  tenantId?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly jwt: JwtService) {}

  async use(request: TenantRequest, _response: Response, next: NextFunction): Promise<void> {
    const authorization = request.header('authorization');
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() === 'bearer' && token) {
      try {
        const claims = await this.jwt.verifyAsync<AccessTokenClaims>(token);
        if (
          typeof claims.sub === 'string' &&
          UUID_PATTERN.test(claims.sub) &&
          typeof claims.tenantId === 'string' &&
          UUID_PATTERN.test(claims.tenantId) &&
          USER_ROLES.includes(claims.role)
        ) {
          request.user = claims;
          request.tenantId = claims.tenantId;
        }
      } catch {
        // Authentication guards reject invalid tokens on protected routes.
      }
    }

    next();
  }
}