jest.mock('@whiskeysockets/baileys', () => ({
  default: jest.fn(() => ({
    ev: { on: jest.fn(), removeAllListeners: jest.fn() },
    end: jest.fn(),
    sendMessage: jest.fn().mockResolvedValue({ key: { id: 'msg-123' } }),
    groupFetchAllParticipating: jest.fn().mockResolvedValue({}),
  })),
  Browsers: { macOS: jest.fn() },
  DisconnectReason: { loggedOut: 401 },
  fetchLatestBaileysVersion: jest.fn().mockResolvedValue({ version: [2, 3000, 1] }),
  useMultiFileAuthState: jest.fn().mockResolvedValue({ state: {}, saveCreds: jest.fn() }),
}));

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from '../src/app/auth/auth.service';
import { WhatsAppService } from '../src/app/whatsapp/whatsapp.service';

describe('AuthService login', () => {
  it('issues tokens for a valid user and rejects bad credentials', async () => {
    const passwordHash = await hash('StrongPass!123', 12);
    const query = jest.fn(async (sql: string, params: unknown[]) => {
      if (sql.includes('FROM users')) {
        return {
          rows: [{
            id: 'u-1',
            tenant_id: 'tenant-1',
            email: 'admin@example.com',
            password_hash: passwordHash,
            first_name: 'Admin',
            last_name: 'User',
            role_key: 'TENANT_ADMIN',
          }],
        };
      }
      return { rows: [] };
    });

    const database = { withTenant: jest.fn(async (_tenantId: string, callback: (client: any) => Promise<unknown>) => callback({ query })), } as any;
    const jwt = {
      signAsync: jest.fn(async () => 'signed-token'),
    } as unknown as JwtService;
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return '12345678901234567890123456789012';
        if (key === 'JWT_REFRESH_SECRET') return 'abcdefghijklmnopqrstuvwxzy12345678';
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        return undefined;
      }),
    } as unknown as ConfigService;

    const service = new AuthService(database, jwt, config);

    await expect(service.login('admin@example.com', 'StrongPass!123')).resolves.toMatchObject({
      accessToken: 'signed-token',
      refreshToken: 'signed-token',
      user: expect.objectContaining({ email: 'admin@example.com' }),
    });

    await expect(service.login('admin@example.com', 'wrong-pass')).rejects.toThrow(UnauthorizedException);
  });

  it('loads synced contacts and groups from the database instead of static fixtures', async () => {
    const database = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM contacts')) {
          return {
            rows: [
              { id: 'db-contact-1', display_name: 'Dynamic User', phone_e164: '+15550000001', email: 'dynamic@example.com', created_at: '2026-10-02T08:00:00.000Z' },
            ],
          };
        }

        if (sql.includes('FROM whatsapp_groups')) {
          return {
            rows: [
              { id: 'db-group-1', name: 'Dynamic Group', provider_group_id: 'group-42', participant_count: 12, updated_at: '2026-10-02T09:00:00.000Z' },
            ],
          };
        }

        return { rows: [] };
      }),
    } as any;

    const service = new WhatsAppService(database);
    service.connect();

    const contacts = await service.getContacts({ limit: 10 });
    expect(contacts.items).toEqual([
      expect.objectContaining({ displayName: 'Dynamic User', phoneE164: '+15550000001' }),
    ]);

    const groups = await service.getGroups({ limit: 10 });
    expect(groups.items).toEqual([
      expect.objectContaining({ name: 'Dynamic Group', providerGroupId: 'group-42' }),
    ]);
  });
});
