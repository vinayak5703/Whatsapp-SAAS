export const USER_ROLES = [
  'SUPER_ADMIN',
  'TENANT_ADMIN',
  'MANAGER',
  'OPERATOR',
  'VIEWER',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PERMISSIONS = [
  'dashboard.view',
  'contacts.view',
  'contacts.create',
  'contacts.edit',
  'contacts.delete',
  'groups.view',
  'groups.sync',
  'messages.send',
  'messages.send_bulk',
  'campaigns.create',
  'campaigns.start',
  'campaigns.stop',
  'media.upload',
  'templates.manage',
  'logs.view',
  'reports.view',
  'settings.view',
  'whatsapp.connect',
  'whatsapp.disconnect',
  'users.manage',
  'billing.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface AccessTokenClaims {
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedUser extends AccessTokenClaims {}