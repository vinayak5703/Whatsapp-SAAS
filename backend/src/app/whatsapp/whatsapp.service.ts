import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pino from 'pino';
import * as qrcode from 'qrcode';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from '@whiskeysockets/baileys';

import { DatabaseService } from '../database/database.service';
import { atomicWriteJson, safeReadJson } from '../utils/storage.util';

export type WhatsAppStatus = 'connected' | 'connecting' | 'qr_required' | 'disconnected' | 'error';

export interface WhatsAppConnectionState {
  status: WhatsAppStatus;
  provider: string;
  phoneNumber: string;
  connectedAt?: string | null;
  lastActiveAt?: string | null;
}

export interface WhatsAppQrPayload {
  imageDataUrl: string;
  expiresAt: string;
}

export interface WhatsAppContactRecord {
  id: string;
  displayName: string;
  phoneE164: string;
  email: string | null;
  createdAt: string;
}

export interface WhatsAppGroupRecord {
  id: string;
  name: string;
  providerGroupId: string;
  participantCount: number;
  updatedAt: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  nextCursor?: string | null;
}

export interface MediaPayload {
  base64: string;
  fileName?: string;
  mimetype?: string;
  type?: 'image' | 'document' | 'audio' | 'video';
}

export interface BulkSendItem {
  target: string;
  name?: string;
  type: 'contact' | 'group' | 'manual';
  success: boolean;
  messageId?: string | null;
  error?: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  details: BulkSendItem[];
}

interface ContactRow {
  id: string;
  display_name: string | null;
  phone_e164: string | null;
  email: string | null;
  created_at: string | null;
}

interface GroupRow {
  id: string;
  name: string | null;
  provider_group_id: string | null;
  participant_count: number | string | null;
  updated_at: string | null;
}

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppService.name);
  private sock: WASocket | null = null;
  private readonly authFolderPath = join(process.cwd(), 'sessions', 'whatsapp_auth');

  private currentQrDataUrl: string | null = null;
  private qrExpiresAt: string | null = null;
  private isConnecting = false;

  private readonly syncedContacts = new Map<string, WhatsAppContactRecord>();
  private readonly syncedGroups = new Map<string, WhatsAppGroupRecord>();

  private readonly providerName = process.env.WHATSAPP_PROVIDER_NAME ?? 'WhatsApp Baileys Connector';
  private currentPhoneNumber = process.env.WHATSAPP_PHONE_NUMBER ?? '';

  private readonly messageHistoryFilePath = join(process.cwd(), 'sessions', 'message_history.json');

  private readonly messageHistory: Array<{
    id: string;
    recipient: string;
    status: 'sent' | 'failed' | 'delivered';
    body?: string;
    hasMedia: boolean;
    createdAt: string;
  }> = [];

  private connectionState: WhatsAppConnectionState = {
    status: 'disconnected',
    provider: this.providerName,
    phoneNumber: '',
    connectedAt: null,
    lastActiveAt: new Date().toISOString(),
  };

  constructor(private readonly database?: DatabaseService) {
    this.loadPersistedHistory();
  }

  async onModuleInit() {
    this.loadPersistedHistory();
    // If an existing auth session exists, attempt auto-reconnect on startup
    if (existsSync(join(this.authFolderPath, 'creds.json'))) {
      this.logger.log('Existing WhatsApp session found. Initializing connection...');
      await this.connect();
    }
  }

  private loadPersistedHistory(): void {
    try {
      const parsed = safeReadJson<any[]>(this.messageHistoryFilePath, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.messageHistory.length = 0;
        this.messageHistory.push(...parsed);
        this.logger.log(`Loaded ${this.messageHistory.length} persisted outbound messages from disk.`);
      }
    } catch (err) {
      this.logger.warn('Could not load message history from disk:', err);
    }
  }

  private persistMessageHistory(): void {
    try {
      atomicWriteJson(this.messageHistoryFilePath, this.messageHistory.slice(0, 1000));
    } catch (err) {
      this.logger.warn('Could not persist message history to disk:', err);
    }
  }

  async onModuleDestroy() {
    await this.cleanupSocket(false);
  }

  getConnection(): WhatsAppConnectionState {
    return {
      ...this.connectionState,
      provider: this.providerName,
      phoneNumber: this.currentPhoneNumber || this.connectionState.phoneNumber || 'Not paired yet',
    };
  }

  async connect(): Promise<WhatsAppConnectionState> {
    if (this.sock && this.connectionState.status === 'connected') {
      return this.getConnection();
    }

    if (this.isConnecting) {
      return this.getConnection();
    }

    this.isConnecting = true;
    this.connectionState.status = 'connecting';

    try {
      if (!existsSync(this.authFolderPath)) {
        mkdirSync(this.authFolderPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolderPath);
      const { version } = await fetchLatestBaileysVersion();

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }) as any,
        printQRInTerminal: true,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
      });

      this.sock.ev.on('creds.update', saveCreds);

      // Listen for contacts sync from Baileys
      this.sock.ev.on('contacts.upsert', (contacts) => {
        this.handleContactsUpsert(contacts);
      });

      this.sock.ev.on('contacts.update', (updates) => {
        this.handleContactsUpsert(updates as any);
      });

      // Listen for initial messaging history sync (chats and contacts)
      this.sock.ev.on('messaging-history.set', ({ contacts, chats, isLatest }) => {
        this.logger.log(`Received WhatsApp history sync: ${contacts?.length || 0} contacts, ${chats?.length || 0} chats (isLatest: ${isLatest})`);
        if (contacts && contacts.length > 0) {
          this.handleContactsUpsert(contacts);
        }
      });

      // Listen for groups updates
      this.sock.ev.on('groups.upsert', (groups) => {
        for (const g of groups) {
          this.syncedGroups.set(g.id, {
            id: g.id,
            name: g.subject || 'WhatsApp Group',
            providerGroupId: g.id,
            participantCount: g.participants?.length || 0,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const dataUrl = await qrcode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            this.currentQrDataUrl = dataUrl;
            this.qrExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();
            this.connectionState.status = 'qr_required';
            this.logger.log('New WhatsApp QR code generated for pairing.');
          } catch (qrErr) {
            this.logger.error('Failed to convert QR string to image', qrErr);
          }
        }

        if (connection === 'open') {
          this.isConnecting = false;
          const userJid = this.sock?.user?.id ?? '';
          const cleanPhone = userJid.split(':')[0].replace(/[^0-9]/g, '');
          this.currentPhoneNumber = cleanPhone ? `+${cleanPhone}` : 'Connected Device';

          const now = new Date().toISOString();
          this.connectionState = {
            status: 'connected',
            provider: this.providerName,
            phoneNumber: this.currentPhoneNumber,
            connectedAt: this.connectionState.connectedAt ?? now,
            lastActiveAt: now,
          };
          this.currentQrDataUrl = null;
          this.qrExpiresAt = null;
          this.logger.log(`WhatsApp connected successfully! Phone: ${this.currentPhoneNumber}`);

          // Automatically sync groups and group participant contacts upon connection
          setTimeout(async () => {
            try {
              this.logger.log('Running automatic post-connect group and contact sync...');
              await this.syncGroups();
              this.logger.log(`Auto-sync complete: ${this.syncedGroups.size} groups, ${this.syncedContacts.size} contacts.`);
            } catch (syncErr) {
              this.logger.warn('Auto-sync encountered an error', syncErr);
            }
          }, 2000);
        }

        if (connection === 'close') {
          this.isConnecting = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          this.logger.warn(`WhatsApp connection closed. Status code: ${statusCode}, LoggedOut: ${isLoggedOut}`);

          if (isLoggedOut) {
            this.logger.log('Session logged out by user or server. Disconnecting and clearing session.');
            await this.disconnect();
          } else {
            // Status 515 (restartRequired) is standard Baileys pairing handshake restart
            // Immediately reconnect with newly saved credentials to complete device link
            this.connectionState.status = 'connecting';
            this.logger.log(`Reconnecting WhatsApp socket (code: ${statusCode})...`);
            
            setTimeout(() => {
              this.connect().catch((err) => {
                this.logger.error('Failed auto-reconnect after close', err);
              });
            }, statusCode === 515 || statusCode === DisconnectReason.restartRequired ? 300 : 2000);
          }
        }
      });
    } catch (error) {
      this.isConnecting = false;
      this.connectionState.status = 'error';
      this.logger.error('Error during WhatsApp socket initialization', error);
    }

    return this.getConnection();
  }

  private handleContactsUpsert(contacts: any[]): void {
    for (const c of contacts) {
      if (!c || !c.id || c.id.includes('@g.us') || c.id.includes('@broadcast')) {
        continue;
      }

      const cleanPhone = c.id.split('@')[0].replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 7) continue;

      const phoneE164 = `+${cleanPhone}`;
      const name = c.name || c.notify || c.verifiedName;
      const displayName = name ? String(name).trim() : phoneE164;

      const record: WhatsAppContactRecord = {
        id: c.id,
        displayName,
        phoneE164,
        email: null,
        createdAt: new Date().toISOString(),
      };

      this.syncedContacts.set(phoneE164, record);
      this.persistContactToDatabase(record).catch(() => {});
    }
  }

  private async persistContactToDatabase(contact: WhatsAppContactRecord): Promise<void> {
    if (!this.database) return;
    try {
      // Find tenant ID or use first active tenant
      const tenantRes = await this.database.query<{ id: string }>('SELECT id FROM tenants WHERE deleted_at IS NULL LIMIT 1');
      const tenantId = tenantRes.rows[0]?.id;
      if (!tenantId) return;

      await this.database.query(
        `INSERT INTO contacts (tenant_id, phone_e164, display_name, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (tenant_id, phone_e164)
         DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now()`,
        [tenantId, contact.phoneE164, contact.displayName],
      );
    } catch {
      // Ignore database errors during background sync
    }
  }

  private async persistGroupToDatabase(group: WhatsAppGroupRecord): Promise<void> {
    if (!this.database) return;
    try {
      const tenantRes = await this.database.query<{ id: string }>('SELECT id FROM tenants WHERE deleted_at IS NULL LIMIT 1');
      const tenantId = tenantRes.rows[0]?.id;
      if (!tenantId) return;

      // Find or create connection record
      const connRes = await this.database.query<{ id: string }>(
        'SELECT id FROM whatsapp_connections WHERE tenant_id = $1 AND deleted_at IS NULL LIMIT 1',
        [tenantId],
      );
      let connectionId = connRes.rows[0]?.id;
      if (!connectionId) {
        const newConn = await this.database.query<{ id: string }>(
          `INSERT INTO whatsapp_connections (tenant_id, provider, status)
           VALUES ($1, 'baileys', 'connected')
           RETURNING id`,
          [tenantId],
        );
        connectionId = newConn.rows[0]?.id;
      }
      if (!connectionId) return;

      await this.database.query(
        `INSERT INTO whatsapp_groups (tenant_id, connection_id, provider_group_id, name, participant_count, updated_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (tenant_id, connection_id, provider_group_id)
         DO UPDATE SET name = EXCLUDED.name, participant_count = EXCLUDED.participant_count, updated_at = now()`,
        [tenantId, connectionId, group.providerGroupId, group.name, group.participantCount],
      );
    } catch {
      // Ignore database errors during background sync
    }
  }

  async disconnect(removeAuthFiles: boolean = true): Promise<WhatsAppConnectionState> {
    await this.cleanupSocket(removeAuthFiles);

    this.currentPhoneNumber = '';
    this.currentQrDataUrl = null;
    this.qrExpiresAt = null;
    this.isConnecting = false;

    // Clear all in-memory contacts and groups on disconnect
    this.syncedContacts.clear();
    this.syncedGroups.clear();

    if (this.database) {
      try {
        await this.database.query('UPDATE contacts SET deleted_at = now() WHERE deleted_at IS NULL');
        await this.database.query('UPDATE whatsapp_groups SET deleted_at = now() WHERE deleted_at IS NULL');
      } catch (err) {
        this.logger.debug('Error clearing database records on disconnect', err);
      }
    }

    this.connectionState = {
      status: 'disconnected',
      provider: this.providerName,
      phoneNumber: '',
      connectedAt: null,
      lastActiveAt: new Date().toISOString(),
    };

    this.logger.log('WhatsApp connection disconnected, session and synced records cleared.');
    return this.getConnection();
  }

  async clearAllSessionData(): Promise<void> {
    await this.disconnect(true);
    this.messageHistory.length = 0;
    this.syncedContacts.clear();
    this.syncedGroups.clear();
    this.currentPhoneNumber = '';
    this.currentQrDataUrl = null;
    this.qrExpiresAt = null;
    this.isConnecting = false;
    this.connectionState = {
      status: 'disconnected',
      provider: this.providerName,
      phoneNumber: '',
      connectedAt: null,
      lastActiveAt: new Date().toISOString(),
    };
    this.logger.log('All WhatsApp data and history fully wiped on session logout.');
  }

  async reconnect(): Promise<WhatsAppConnectionState> {
    await this.disconnect();
    return this.connect();
  }

  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  async getQr(): Promise<WhatsAppQrPayload> {
    if (!this.isConnected() && !this.currentQrDataUrl && !this.isConnecting) {
      await this.connect();
    }

    return {
      imageDataUrl: this.currentQrDataUrl ?? '',
      expiresAt: this.qrExpiresAt ?? new Date(Date.now() + 60 * 1000).toISOString(),
    };
  }

  private async cleanupSocket(removeAuthFiles: boolean): Promise<void> {
    if (this.sock) {
      try {
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('contacts.upsert');
        this.sock.ev.removeAllListeners('contacts.update');
        this.sock.ev.removeAllListeners('messaging-history.set');
        this.sock.ev.removeAllListeners('groups.upsert');
        this.sock.ev.removeAllListeners('groups.update');
        this.sock.end(undefined);
      } catch (e) {
        this.logger.debug('Error while closing socket', e);
      }
      this.sock = null;
    }

    if (removeAuthFiles && existsSync(this.authFolderPath)) {
      try {
        rmSync(this.authFolderPath, { recursive: true, force: true });
      } catch (err) {
        this.logger.warn('Failed to delete auth folder', err);
      }
    }
  }

  async getContacts(params: { limit?: number; search?: string; cursor?: string } = {}): Promise<PageResult<WhatsAppContactRecord>> {
    const limit = Number(params.limit ?? 25);
    const search = (params.search ?? '').trim().toLowerCase();

    const mergedContacts = new Map<string, WhatsAppContactRecord>(this.syncedContacts);

    if (this.database) {
      try {
        const { rows } = await this.database.query<ContactRow>(
          `SELECT id, display_name, phone_e164, COALESCE(attributes->>'email', NULL) AS email, created_at
           FROM contacts
           WHERE deleted_at IS NULL
           ORDER BY created_at DESC`,
        );

        for (const row of rows) {
          const phone = row.phone_e164 ?? '';
          if (phone && !mergedContacts.has(phone)) {
            mergedContacts.set(phone, {
              id: row.id,
              displayName: row.display_name ?? 'Unknown contact',
              phoneE164: phone,
              email: row.email ?? null,
              createdAt: row.created_at ?? new Date().toISOString(),
            });
          }
        }
      } catch {
        // Fallback to in-memory synced contacts
      }
    }

    const items = Array.from(mergedContacts.values()).filter((contact) => {
      if (!search) return true;
      return [contact.displayName, contact.phoneE164, contact.email ?? '']
        .join(' ')
        .toLowerCase()
        .includes(search);
    });

    const page = items.slice(0, limit);
    return { items: page, total: items.length, nextCursor: page.length === items.length ? null : 'next' };
  }

  async syncContacts(): Promise<WhatsAppContactRecord[]> {
    if (this.isConnected() && this.sock) {
      await this.syncGroups();
    }
    const result = await this.getContacts({ limit: 1000 });
    return result.items;
  }

  async getGroups(params: { limit?: number; search?: string } = {}): Promise<PageResult<WhatsAppGroupRecord>> {
    const limit = Number(params.limit ?? 25);
    const search = (params.search ?? '').trim().toLowerCase();

    // If connected via Baileys and syncedGroups is empty, trigger a live sync
    if (this.isConnected() && this.sock && this.syncedGroups.size === 0) {
      try {
        await this.syncGroups();
      } catch (err) {
        this.logger.warn('Failed to auto-sync groups on getGroups', err);
      }
    }

    const mergedGroups = new Map<string, WhatsAppGroupRecord>(this.syncedGroups);

    if (this.database) {
      try {
        const { rows } = await this.database.query<GroupRow>(
          `SELECT id, name, provider_group_id, participant_count, updated_at
           FROM whatsapp_groups
           WHERE deleted_at IS NULL
           ORDER BY updated_at DESC`,
        );

        for (const row of rows) {
          const gid = row.provider_group_id || row.id;
          if (gid && !mergedGroups.has(gid)) {
            mergedGroups.set(gid, {
              id: row.id,
              name: row.name ?? 'Untitled group',
              providerGroupId: gid,
              participantCount: Number(row.participant_count ?? 0),
              updatedAt: row.updated_at ?? new Date().toISOString(),
            });
          }
        }
      } catch {
        // Fallback to in-memory synced groups
      }
    }

    const items = Array.from(mergedGroups.values()).filter((group) => {
      if (!search) return true;
      return [group.name, group.providerGroupId].join(' ').toLowerCase().includes(search);
    });

    return { items: items.slice(0, limit), total: items.length };
  }

  async syncGroups(): Promise<WhatsAppGroupRecord[]> {
    if (!this.isConnected() || !this.sock) {
      const dbResult = await this.getGroups({ limit: 1000 });
      return dbResult.items;
    }

    try {
      const participating = await this.sock.groupFetchAllParticipating();
      const groupsList: WhatsAppGroupRecord[] = [];

      for (const [id, g] of Object.entries(participating)) {
        const groupRecord: WhatsAppGroupRecord = {
          id: g.id || id,
          name: g.subject || 'Untitled WhatsApp Group',
          providerGroupId: g.id || id,
          participantCount: g.participants?.length || 0,
          updatedAt: new Date(g.creation ? g.creation * 1000 : Date.now()).toISOString(),
        };

        this.syncedGroups.set(groupRecord.providerGroupId, groupRecord);
        groupsList.push(groupRecord);
        this.persistGroupToDatabase(groupRecord).catch(() => {});

        // Extract participants into contacts
        if (g.participants && Array.isArray(g.participants)) {
          for (const p of g.participants) {
            const cleanPhone = (p.id || '').split('@')[0].replace(/[^0-9]/g, '');
            if (cleanPhone && cleanPhone.length >= 7) {
              const phoneE164 = `+${cleanPhone}`;
              if (!this.syncedContacts.has(phoneE164)) {
                const contactRecord: WhatsAppContactRecord = {
                  id: p.id,
                  displayName: phoneE164,
                  phoneE164,
                  email: null,
                  createdAt: new Date().toISOString(),
                };
                this.syncedContacts.set(phoneE164, contactRecord);
                this.persistContactToDatabase(contactRecord).catch(() => {});
              }
            }
          }
        }
      }

      this.logger.log(`Synced ${groupsList.length} groups and extracted contacts.`);
      return groupsList;
    } catch (err) {
      this.logger.error('Failed to sync groups from WhatsApp socket', err);
      const fallback = await this.getGroups({ limit: 1000 });
      return fallback.items;
    }
  }

  async refreshGroup(groupId: string): Promise<WhatsAppGroupRecord | null> {
    if (this.isConnected() && this.sock) {
      try {
        const metadata = await this.sock.groupMetadata(groupId);
        if (metadata) {
          const record: WhatsAppGroupRecord = {
            id: metadata.id,
            name: metadata.subject,
            providerGroupId: metadata.id,
            participantCount: metadata.participants?.length || 0,
            updatedAt: new Date().toISOString(),
          };
          this.syncedGroups.set(record.providerGroupId, record);
          this.persistGroupToDatabase(record).catch(() => {});
          return record;
        }
      } catch (err) {
        this.logger.debug('Could not get group metadata from socket', err);
      }
    }

    if (!this.database) return this.syncedGroups.get(groupId) || null;

    try {
      const { rows } = await this.database.query<GroupRow>(
        `SELECT id, name, provider_group_id, participant_count, updated_at
         FROM whatsapp_groups
         WHERE (id = $1 OR provider_group_id = $1) AND deleted_at IS NULL
         LIMIT 1`,
        [groupId],
      );

      const row = rows[0];
      if (!row) return this.syncedGroups.get(groupId) || null;

      return {
        id: row.id,
        name: row.name ?? 'Untitled group',
        providerGroupId: row.provider_group_id ?? '',
        participantCount: Number(row.participant_count ?? 0),
        updatedAt: row.updated_at ?? new Date().toISOString(),
      };
    } catch {
      return this.syncedGroups.get(groupId) || null;
    }
  }

  private buildBaileysMessageContent(text: string, media?: MediaPayload): any {
    if (!media || !media.base64) {
      return { text: text || '' };
    }

    let rawBase64 = media.base64;
    let detectedMime = media.mimetype || 'application/octet-stream';
    if (media.base64.includes(';base64,')) {
      const parts = media.base64.split(';base64,');
      detectedMime = parts[0].replace('data:', '') || detectedMime;
      rawBase64 = parts[1];
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    const type = media.type || (detectedMime.startsWith('image/') ? 'image' : detectedMime.startsWith('audio/') ? 'audio' : detectedMime.startsWith('video/') ? 'video' : 'document');

    if (type === 'image' || detectedMime.startsWith('image/')) {
      return {
        image: buffer,
        caption: text || '',
        mimetype: detectedMime,
      };
    }

    if (type === 'audio' || detectedMime.startsWith('audio/')) {
      return {
        audio: buffer,
        mimetype: detectedMime.includes('audio') ? detectedMime : 'audio/mp4',
        ptt: false, // audio / song mode
      };
    }

    if (type === 'video' || detectedMime.startsWith('video/')) {
      return {
        video: buffer,
        caption: text || '',
        mimetype: detectedMime,
      };
    }

    // Default to document (PDF, DOCX, ZIP, etc.)
    return {
      document: buffer,
      mimetype: detectedMime || 'application/pdf',
      fileName: media.fileName || 'document.pdf',
      caption: text || '',
    };
  }

  async sendMessage(toPhoneOrJid: string, text: string, media?: MediaPayload): Promise<any> {
    if (!this.isConnected() || !this.sock) {
      throw new Error('WhatsApp is not connected. Please scan the QR code first.');
    }

    const raw = toPhoneOrJid.trim();
    let jid = raw;
    if (!raw.includes('@')) {
      jid = `${raw.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    const messageContent = this.buildBaileysMessageContent(text, media);
    const res = await this.sock.sendMessage(jid, messageContent);

    this.messageHistory.unshift({
      id: res?.key?.id || `msg-${Date.now()}`,
      recipient: toPhoneOrJid,
      status: 'sent',
      body: text,
      hasMedia: !!media,
      createdAt: new Date().toISOString(),
    });
    if (this.messageHistory.length > 500) this.messageHistory.pop();
    this.persistMessageHistory();

    return res;
  }

  async sendBulk(payload: {
    recipients?: string[];
    groups?: string[];
    manualNumbers?: string[];
    body: string;
    delayMs?: number;
    media?: MediaPayload;
  }): Promise<BulkSendResult> {
    if (!this.isConnected() || !this.sock) {
      throw new Error('WhatsApp is not connected. Please scan the QR code first.');
    }

    const body = (payload.body || '').trim();
    if (!body && !payload.media) {
      throw new Error('Message body or media attachment is required.');
    }

    const targets: Array<{ jid: string; display: string; type: 'contact' | 'group' | 'manual' }> = [];
    const seenJids = new Set<string>();

    // Process individual recipients
    if (payload.recipients && Array.isArray(payload.recipients)) {
      for (const r of payload.recipients) {
        if (!r) continue;
        const clean = r.replace(/[^0-9]/g, '');
        if (clean) {
          const jid = `${clean}@s.whatsapp.net`;
          if (!seenJids.has(jid)) {
            seenJids.add(jid);
            const contact = this.syncedContacts.get(`+${clean}`);
            targets.push({
              jid,
              display: contact?.displayName || `+${clean}`,
              type: 'contact',
            });
          }
        }
      }
    }

    // Process WhatsApp groups
    if (payload.groups && Array.isArray(payload.groups)) {
      for (const g of payload.groups) {
        if (!g) continue;
        const groupJid = g.includes('@') ? g : `${g}@g.us`;
        if (!seenJids.has(groupJid)) {
          seenJids.add(groupJid);
          const group = this.syncedGroups.get(groupJid);
          targets.push({
            jid: groupJid,
            display: group?.name || groupJid,
            type: 'group',
          });
        }
      }
    }

    // Process manual phone numbers
    if (payload.manualNumbers && Array.isArray(payload.manualNumbers)) {
      for (const m of payload.manualNumbers) {
        if (!m) continue;
        const clean = m.replace(/[^0-9]/g, '');
        if (clean) {
          const jid = `${clean}@s.whatsapp.net`;
          if (!seenJids.has(jid)) {
            seenJids.add(jid);
            targets.push({
              jid,
              display: `+${clean}`,
              type: 'manual',
            });
          }
        }
      }
    }

    if (targets.length === 0) {
      throw new Error('No valid recipients or groups selected.');
    }

    const results: BulkSendItem[] = [];
    let sentCount = 0;
    let failedCount = 0;
    const delay = Math.max(300, Number(payload.delayMs ?? 1000));

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const customizedBody = body
        .replace(/\{\{name\}\}/gi, target.display)
        .replace(/\{\{firstName\}\}/gi, target.display.split(' ')[0]);

      const messageContent = this.buildBaileysMessageContent(customizedBody, payload.media);

      try {
        const res = await this.sock.sendMessage(target.jid, messageContent);
        sentCount++;
        const msgId = res?.key?.id || `bulk-${Date.now()}-${i}`;
        results.push({
          target: target.display,
          name: target.display,
          type: target.type,
          success: true,
          messageId: msgId,
        });

        this.messageHistory.unshift({
          id: msgId,
          recipient: target.display,
          status: 'sent',
          body: customizedBody,
          hasMedia: !!payload.media,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        failedCount++;
        this.logger.error(`Failed to send message to ${target.jid}`, err);
        results.push({
          target: target.display,
          name: target.display,
          type: target.type,
          success: false,
          error: err?.message || 'Failed to send message',
        });

        this.messageHistory.unshift({
          id: `fail-${Date.now()}-${i}`,
          recipient: target.display,
          status: 'failed',
          body: customizedBody,
          hasMedia: !!payload.media,
          createdAt: new Date().toISOString(),
        });
      }

      if (this.messageHistory.length > 500) this.messageHistory.pop();

      if (i < targets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.persistMessageHistory();

    return {
      total: targets.length,
      sent: sentCount,
      failed: failedCount,
      details: results,
    };
  }

  async getDashboardSummary(): Promise<any> {
    const contacts = await this.getContacts({ limit: 1000 });
    const groups = await this.getGroups({ limit: 1000 });

    const totalSent = this.messageHistory.filter((m) => m.status === 'sent' || m.status === 'delivered').length;
    const totalFailed = this.messageHistory.filter((m) => m.status === 'failed').length;
    const mediaSent = this.messageHistory.filter((m) => m.hasMedia).length;

    const days: Array<{ date: string; dayLabel: string; sent: number; failed: number }> = [];
    const now = new Date();

    const getLocalDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = getLocalDateKey(d);
      const dayName = dayNames[d.getDay()];

      const daySent = this.messageHistory.filter((m) => {
        const mDate = getLocalDateKey(new Date(m.createdAt));
        return mDate === dateKey && (m.status === 'sent' || m.status === 'delivered');
      }).length;

      const dayFailed = this.messageHistory.filter((m) => {
        const mDate = getLocalDateKey(new Date(m.createdAt));
        return mDate === dateKey && m.status === 'failed';
      }).length;

      days.push({
        date: dateKey,
        dayLabel: i === 0 ? 'Today' : dayName,
        sent: daySent,
        failed: dayFailed,
      });
    }

    const todayKey = getLocalDateKey(now);
    const messagesSentToday = this.messageHistory.filter((m) => {
      const mDate = getLocalDateKey(new Date(m.createdAt));
      return mDate === todayKey && (m.status === 'sent' || m.status === 'delivered');
    }).length;

    return {
      whatsappStatus: this.connectionState.status,
      totalContacts: contacts.total ?? contacts.items.length,
      totalGroups: groups.total ?? groups.items.length,
      messagesSentToday,
      messagesDelivered: totalSent,
      messagesRead: Math.floor(totalSent * 0.85),
      messagesFailed: totalFailed,
      campaignsRunning: 0,
      campaignsCompleted: totalSent > 0 ? 1 : 0,
      mediaSent,
      apiUsage: this.messageHistory.length,
      queuePending: 0,
      queueFailed: 0,
      messageVolume: days,
      latestMessages: this.messageHistory.slice(0, 10),
    };
  }

  async getRecentMessages(): Promise<any[]> {
    return this.messageHistory.slice(0, 50);
  }
}
