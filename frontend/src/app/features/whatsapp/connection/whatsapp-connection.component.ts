import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CircleAlert, Database, Link2, LucideAngularModule, QrCode, RefreshCw, ShieldCheck, Unplug, Users } from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';

interface WhatsAppConnection {
  status: string;
  phoneNumber?: string;
  connectedAt?: string;
  lastActiveAt?: string;
  provider?: string;
}

interface QrResponse {
  imageDataUrl: string;
  expiresAt: string;
}

@Component({
  selector: 'app-whatsapp-connection',
  standalone: true,
  imports: [DatePipe, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Channels</p>
          <h1>WhatsApp connection</h1>
          <p class="page-subtitle">Connect your WhatsApp account to sync groups, contacts, and send messages.</p>
        </div>
        <div class="header-actions">
          @if (connection()?.status === 'connected' || connection()?.status === 'authenticated') {
            <button class="button button-primary" type="button" (click)="syncAll()" [disabled]="syncing()">
              <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="syncing()" />
              {{ syncing() ? 'Syncing data…' : 'Sync Groups & Contacts' }}
            </button>
          }
          <button class="button button-secondary" type="button" (click)="loadConnection()" [disabled]="loading()">
            <lucide-angular [img]="RefreshCw" [size]="15" />Refresh
          </button>
        </div>
      </div>

      @if (error()) { <div class="connection-error"><lucide-angular [img]="CircleAlert" [size]="17" />{{ error() }}</div> }
      @if (notice()) { <div class="connection-notice"><lucide-angular [img]="ShieldCheck" [size]="17" />{{ notice() }}</div> }

      <div class="connection-layout">
        <section class="connection-card surface">
          <div class="connection-card-head">
            <span class="channel-mark"><lucide-angular [img]="Link2" [size]="19" /></span>
            <div>
              <h2>WhatsApp Baileys Web</h2>
              <p>Direct Web WhatsApp Connection</p>
            </div>
            <span class="status" [class]="'status-' + statusClass()">{{ connection()?.status || (loading() ? 'loading' : 'unavailable') }}</span>
          </div>

          <div class="connection-graphic">
            <span class="orbit orbit-one"></span>
            <span class="orbit orbit-two"></span>
            <span class="connection-logo"><lucide-angular [img]="Link2" [size]="29" /></span>
            <span class="graphic-dot dot-one"></span>
            <span class="graphic-dot dot-two"></span>
          </div>

          @if (connection()?.status === 'connected' || connection()?.status === 'authenticated') {
            <div class="connected-copy">
              <span class="connected-check"><lucide-angular [img]="ShieldCheck" [size]="18" /></span>
              <strong>Channel connected & active</strong>
              <span>{{ connection()?.phoneNumber || 'Number synced' }}</span>
            </div>

            <dl class="connection-details">
              <div><dt>Provider</dt><dd>{{ connection()?.provider || 'WhatsApp' }}</dd></div>
              <div><dt>Connected</dt><dd>{{ connection()?.connectedAt | date:'medium' }}</dd></div>
              <div><dt>Last active</dt><dd>{{ connection()?.lastActiveAt | date:'medium' }}</dd></div>
            </dl>

            <div class="sync-actions-group">
              <button class="button button-primary full-width" type="button" (click)="syncAll()" [disabled]="syncing() || actionRunning()">
                <lucide-angular [img]="Database" [size]="15" />
                {{ syncing() ? 'Syncing contacts & groups…' : 'Sync All WhatsApp Contacts & Groups' }}
              </button>
              <button class="button button-secondary disconnect-button full-width" type="button" (click)="disconnect()" [disabled]="actionRunning()">
                <lucide-angular [img]="Unplug" [size]="15" />
                Disconnect WhatsApp
              </button>
            </div>
          } @else {
            <div class="connected-copy">
              <strong>{{ statusMessage() }}</strong>
              <span>Scan QR code below with WhatsApp > Linked Devices to connect and sync your groups and contacts.</span>
            </div>
            <button class="button button-primary connect-button full-width" type="button" (click)="connect()" [disabled]="actionRunning()">
              <lucide-angular [img]="Link2" [size]="15" />
              {{ actionRunning() ? 'Initializing…' : 'Connect & Generate QR Code' }}
            </button>
          }
        </section>

        <section class="qr-card surface">
          <div class="qr-heading">
            <span class="qr-icon"><lucide-angular [img]="QrCode" [size]="18" /></span>
            <div>
              <h2>Pair with WhatsApp</h2>
              <p>WhatsApp on phone > Settings > Linked Devices > Link a device</p>
            </div>
          </div>

          @if (connection()?.status === 'connected' || connection()?.status === 'authenticated') {
            <div class="qr-connected">
              <span class="qr-connected-mark"><lucide-angular [img]="ShieldCheck" [size]="32" /></span>
              <strong>WhatsApp is actively connected!</strong>
              <p>Groups and contacts are continuously synced. You can now compose and broadcast messages.</p>
            </div>
          } @else if (qrImage()) {
            <div class="qr-display">
              <img [src]="qrImage()" alt="WhatsApp connection QR code">
              <span class="qr-expiry">QR code refreshes automatically &bull; Expires {{ qrExpiresAt() | date:'shortTime' }}</span>
            </div>
            <button class="button button-secondary qr-action" type="button" (click)="refreshQr()" [disabled]="actionRunning()">
              <lucide-angular [img]="RefreshCw" [size]="15" />
              Refresh QR code
            </button>
          } @else {
            <div class="qr-empty">
              <span class="qr-empty-mark"><lucide-angular [img]="QrCode" [size]="24" /></span>
              <strong>QR code not ready</strong>
              <span>Click button below to start WhatsApp pairing socket and produce the QR code.</span>
            </div>
            <button class="button button-primary qr-action" type="button" (click)="refreshQr()" [disabled]="actionRunning()">
              <lucide-angular [img]="QrCode" [size]="15" />
              Generate pairing QR code
            </button>
          }
          <p class="security-note"><lucide-angular [img]="ShieldCheck" [size]="14" />Multi-device encrypted session.</p>
        </section>
      </div>
    </section>
  `,
  styles: [`
    .connection-layout { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(280px,.8fr); align-items:start; gap:15px; }
    .connection-card,.qr-card { padding:21px; }
    .header-actions { display:flex; gap:9px; align-items:center; }
    .connection-card-head { display:flex; align-items:center; gap:11px; }
    .channel-mark,.qr-icon { display:grid; width:38px; height:38px; flex:none; place-items:center; border-radius:9px; background:#e6f2eb; color:#176b4a; }
    .connection-card-head div { min-width:0; flex:1; }
    .connection-card-head h2,.qr-heading h2 { margin:0 0 4px; font-size:14px; }
    .connection-card-head p,.qr-heading p { margin:0; color:#89938c; font-size:10px; }
    .connection-graphic { position:relative; display:grid; height:195px; place-items:center; overflow:hidden; margin:20px 0 13px; border-radius:8px; background:radial-gradient(ellipse at center,#eff7ef 0,#f7f9f6 63%,#fbfcfa 100%); }
    .orbit { position:absolute; width:130px; height:130px; border:1px solid #d7e9db; border-radius:50%; }
    .orbit-two { width:175px; height:175px; border-color:#e2eee3; }
    .connection-logo { z-index:1; display:grid; width:66px; height:66px; place-items:center; border:1px solid #d9eade; border-radius:20px; background:#fff; color:#176b4a; box-shadow:0 10px 25px rgb(36 101 64 / 12%); }
    .graphic-dot { position:absolute; width:8px; height:8px; border-radius:50%; background:#d8f071; }
    .dot-one { top:42px; left:calc(50% + 52px); }
    .dot-two { bottom:46px; left:calc(50% - 68px); width:5px; height:5px; background:#4e9f70; }
    .connected-copy { display:grid; justify-items:center; gap:6px; padding:3px 0 17px; text-align:center; }
    .connected-copy strong { font-family:Manrope,sans-serif; font-size:14px; }
    .connected-copy span { color:#758178; font-size:11px; max-width:340px; line-height:1.4; }
    .connected-check { display:grid; width:32px; height:32px; place-items:center; border-radius:50%; background:#e6f2eb; color:#176b4a!important; }
    .connection-details { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:0 0 16px; border-top:1px solid #edf0eb; border-bottom:1px solid #edf0eb; padding:14px 0; }
    .connection-details dt { margin-bottom:5px; color:#929b94; font-size:9px; }
    .connection-details dd { margin:0; color:#354238; font-size:10px; overflow-wrap:anywhere; }
    .full-width { width:100%; }
    .sync-actions-group { display:grid; gap:8px; }
    .qr-heading { display:flex; align-items:center; gap:11px; }
    .qr-display { display:grid; justify-items:center; gap:9px; margin:20px 0 13px; }
    .qr-display img { width:min(100%,235px); aspect-ratio:1; border:1px solid #e6eae4; border-radius:7px; background:#fff; object-fit:contain; box-shadow:0 4px 12px rgba(0,0,0,0.06); }
    .qr-expiry { color:#8c968f; font-size:10px; }
    .qr-empty,.qr-connected { display:grid; min-height:230px; align-content:center; justify-items:center; gap:9px; color:#8d9890; text-align:center; padding:16px; }
    .qr-connected strong { color:#176b4a; font-size:14px; }
    .qr-connected p { color:#627267; font-size:11px; max-width:280px; margin:0; line-height:1.5; }
    .qr-connected-mark { display:grid; width:56px; height:56px; place-items:center; border-radius:50%; background:#e6f2eb; color:#176b4a; margin-bottom:4px; }
    .qr-empty strong { color:#39463d; font-family:Manrope,sans-serif; font-size:13px; }
    .qr-empty span:last-child { max-width:240px; font-size:10px; line-height:1.5; }
    .qr-empty-mark { display:grid; width:48px; height:48px; place-items:center; border-radius:12px; background:#f2f6ef; color:#176b4a; }
    .qr-action { width:100%; }
    .security-note { display:flex; align-items:center; justify-content:center; gap:6px; margin:14px 0 0; color:#89938c; font-size:9px; }
    .connection-error { display:flex; align-items:center; gap:8px; margin:-10px 0 14px; border:1px solid #efcfc7; border-radius:7px; background:#fff8f5; padding:10px 12px; color:#a95443; font-size:11px; }
    .connection-notice { display:flex; align-items:center; gap:8px; margin:-10px 0 14px; border:1px solid #cce8d7; border-radius:7px; background:#f0f9f3; padding:10px 12px; color:#176b4a; font-size:11px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @media(max-width:760px) { .connection-layout { grid-template-columns:1fr; } .connection-card,.qr-card { padding:16px; } }
  `],
})
export class WhatsappConnectionComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly connection = signal<WhatsAppConnection | null>(null);
  readonly qrImage = signal('');
  readonly qrExpiresAt = signal('');
  readonly loading = signal(true);
  readonly actionRunning = signal(false);
  readonly syncing = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly Link2 = Link2;
  readonly CircleAlert = CircleAlert;
  readonly RefreshCw = RefreshCw;
  readonly ShieldCheck = ShieldCheck;
  readonly Unplug = Unplug;
  readonly QrCode = QrCode;
  readonly Database = Database;
  readonly Users = Users;

  private pollTimer: any = null;

  ngOnInit(): void {
    this.loadConnection();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      const status = this.connection()?.status?.toLowerCase();
      // If we are waiting for QR scan or connecting, keep polling
      if (!status || status === 'connecting' || status === 'qr_required' || !this.connection()) {
        this.loadConnection(true);
        if (!this.qrImage() || status === 'qr_required') {
          this.fetchQrSilent();
        }
      }
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  loadConnection(silent = false): void {
    if (!silent) this.loading.set(true);
    this.error.set('');
    this.api.get<WhatsAppConnection>('whatsapp/connection').subscribe({
      next: (connection) => {
        const prevStatus = this.connection()?.status;
        this.connection.set(connection);
        this.loading.set(false);

        if (connection?.status === 'connected' && prevStatus !== 'connected') {
          this.notice.set('WhatsApp connected successfully! Syncing groups and contacts...');
          this.qrImage.set('');
        }
      },
      error: () => {
        if (!silent) this.error.set('WhatsApp connection status is unavailable. Connect the backend provider API.');
        this.loading.set(false);
      },
    });
  }

  private fetchQrSilent(): void {
    this.api.get<QrResponse>('whatsapp/qr').subscribe({
      next: (response) => {
        if (response.imageDataUrl) {
          this.qrImage.set(response.imageDataUrl);
          this.qrExpiresAt.set(response.expiresAt);
        }
      },
      error: () => {},
    });
  }

  statusClass(): string {
    const status = this.connection()?.status?.toLowerCase() || 'disconnected';
    return status === 'authenticated' ? 'connected' : status;
  }

  statusMessage(): string {
    const status = this.connection()?.status?.toLowerCase();
    if (status === 'connecting') return 'Waiting for device pairing';
    if (status === 'qr_required') return 'Scan the QR pairing code';
    if (status === 'error' || status === 'failed') return 'Connection needs attention';
    return this.loading() ? 'Checking connection status' : 'Not connected yet';
  }

  connect(): void {
    this.actionRunning.set(true);
    this.error.set('');
    this.notice.set('');
    this.api.post('whatsapp/connect', {}).subscribe({
      next: () => {
        this.actionRunning.set(false);
        this.loadConnection();
        this.refreshQr();
      },
      error: () => {
        this.error.set('Failed to initiate WhatsApp connection.');
        this.actionRunning.set(false);
      },
    });
  }

  refreshQr(): void {
    this.actionRunning.set(true);
    this.api.get<QrResponse>('whatsapp/qr').subscribe({
      next: (response) => {
        this.qrImage.set(response.imageDataUrl);
        this.qrExpiresAt.set(response.expiresAt);
        this.actionRunning.set(false);
      },
      error: () => {
        this.error.set('QR code could not be generated. Start a connection and try again.');
        this.actionRunning.set(false);
      },
    });
  }

  syncAll(): void {
    this.syncing.set(true);
    this.notice.set('');
    this.error.set('');

    this.api.post('whatsapp/groups/sync', {}).subscribe({
      next: (res: any) => {
        const count = res?.data?.length ?? 0;
        this.api.post('whatsapp/contacts/sync', {}).subscribe({
          next: (cRes: any) => {
            const cCount = cRes?.data?.length ?? 0;
            this.syncing.set(false);
            this.notice.set(`Successfully synced ${count} WhatsApp groups and ${cCount} contacts!`);
          },
          error: () => {
            this.syncing.set(false);
            this.notice.set(`Synced ${count} WhatsApp groups.`);
          },
        });
      },
      error: () => {
        this.syncing.set(false);
        this.error.set('Sync failed. Please verify that WhatsApp is connected.');
      },
    });
  }

  disconnect(): void {
    this.actionRunning.set(true);
    this.error.set('');
    this.notice.set('');
    this.api.post('whatsapp/disconnect', {}).subscribe({
      next: () => {
        this.actionRunning.set(false);
        this.qrImage.set('');
        this.notice.set('WhatsApp disconnected.');
        this.loadConnection();
      },
      error: () => {
        this.error.set('Failed to disconnect.');
        this.actionRunning.set(false);
      },
    });
  }
}

