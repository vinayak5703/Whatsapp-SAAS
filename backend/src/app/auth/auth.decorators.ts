import { SetMetadata } from '@nestjs/common';
import { Permission } from './auth.types';

export const IS_PUBLIC_KEY = 'isPublic';
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);