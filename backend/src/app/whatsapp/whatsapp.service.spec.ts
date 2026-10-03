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

import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let database: any;

  beforeEach(() => {
    database = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes('FROM contacts')) {
          return {
            rows: [
              {
                id: 'contact-1',
                display_name: 'Dynamic User',
                phone_e164: '+15550000001',
                email: 'dynamic@example.com',
                created_at: '2026-10-02T08:00:00.000Z',
              },
            ],
          };
        }

        if (sql.includes('FROM whatsapp_groups')) {
          return {
            rows: [
              {
                id: 'group-1',
                name: 'Dynamic Group',
                provider_group_id: 'group-42',
                participant_count: 12,
                updated_at: '2026-10-02T09:00:00.000Z',
              },
            ],
          };
        }

        return { rows: [] };
      }),
    };

    service = new WhatsAppService(database);
  });

  it('returns a connection payload with a provider and status', () => {
    const connection = service.getConnection();

    expect(connection.status).toBeDefined();
    expect(connection.provider).toBeDefined();
    expect(connection.phoneNumber).toBeDefined();
  });

  it('generates a QR payload that can be rendered in the UI', async () => {
    const qr = await service.getQr();

    expect(qr.imageDataUrl).toBeDefined();
    expect(qr.expiresAt).toBeDefined();
  });

  it('returns synced contacts after the provider is connected', async () => {
    service.connect();

    const contacts = await service.getContacts({ limit: 25 });

    expect(contacts.items.length).toBeGreaterThan(0);
    expect(contacts.items[0].phoneE164).toMatch(/^\+/);
  });

  it('returns synced groups after the provider is connected', async () => {
    service.connect();

    const groups = await service.getGroups({ limit: 25 });

    expect(groups.items.length).toBeGreaterThan(0);
    expect(groups.items[0].providerGroupId).toBeDefined();
  });
});
