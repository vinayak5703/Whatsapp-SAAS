import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  REQUIRED_PERMISSIONS_KEY,
} from '../src/app/auth/auth.decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TenantContextGuard,
} from '../src/app/auth/auth.guards';
import { AccessTokenClaims } from '../src/app/auth/auth.types';
import { DatabaseService } from '../src/app/database/database.service';
import { TenantRequest } from '../src/app/auth/tenant-context.middleware';

function createContext(request: Partial<TenantRequest>): ExecutionContext {
  const handler = () => undefined;
  class Controller {}
  const context = {
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  Object.assign(context, { handler });
  return context;
}

function setHandlerMetadata(context: ExecutionContext, key: string, value: unknown): void {
  const handler = (context as unknown as { handler: () => void }).handler;
  Reflect.defineMetadata(key, value, handler);
}

function createDatabase(grantedCount: number): DatabaseService {
  return {
    withTenant: jest.fn(async (_tenantId: string, operation: (client: unknown) => Promise<unknown>) =>
      operation({
        query: jest.fn().mockResolvedValue({ rows: [{ granted_count: grantedCount }] }),
      } as never)),
  } as unknown as DatabaseService;
}

const tenantUser: AccessTokenClaims = {
  sub: 'f70b10f5-c334-4de1-a23d-abb66396c598',
  tenantId: 'ac76d502-a008-4bc8-a88a-f1e4f2642d0a',
  role: 'VIEWER',
  email: 'viewer@example.test',
};

describe('authentication and tenant guards', () => {
  it('rejects requests without a verified user', () => {
    const guard = new JwtAuthGuard(new Reflector());
    expect(() => guard.canActivate(createContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects tenant context that differs from the signed claim', () => {
    const guard = new TenantContextGuard(new Reflector());
    expect(() => guard.canActivate(createContext({
      user: tenantUser,
      tenantId: 'd79bac2e-c415-4df8-9ff2-9dad92114832',
    }))).toThrow(ForbiddenException);
  });

  it('allows a matching verified tenant context', () => {
    const guard = new TenantContextGuard(new Reflector());
    expect(guard.canActivate(createContext({ user: tenantUser, tenantId: tenantUser.tenantId }))).toBe(true);
  });

  it('denies protected routes without explicit permission metadata', async () => {
    const guard = new PermissionsGuard(new Reflector(), createDatabase(0));
    await expect(guard.canActivate(createContext({ user: tenantUser }))).rejects.toThrow(ForbiddenException);
  });

  it('checks the tenant role grant in PostgreSQL', async () => {
    const reflector = new Reflector();
    const database = createDatabase(1);
    const guard = new PermissionsGuard(reflector, database);
    const request = { user: tenantUser };
    const readContext = createContext(request);
    setHandlerMetadata(readContext, REQUIRED_PERMISSIONS_KEY, ['contacts.view']);
    await expect(guard.canActivate(readContext)).resolves.toBe(true);

    const deniedGuard = new PermissionsGuard(reflector, createDatabase(0));
    const createContextWithPermission = createContext(request);
    setHandlerMetadata(createContextWithPermission, REQUIRED_PERMISSIONS_KEY, ['contacts.create']);
    await expect(deniedGuard.canActivate(createContextWithPermission)).rejects.toThrow(ForbiddenException);
    expect(database.withTenant).toHaveBeenCalledWith(tenantUser.tenantId, expect.any(Function));
  });

  it('allows public routes without tenant context', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const context = createContext({});
    setHandlerMetadata(context, IS_PUBLIC_KEY, true);
    expect(guard.canActivate(context)).toBe(true);
  });
});