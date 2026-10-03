import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle2, CircleAlert, Clock3, ContactRound,
  FileImage, FileText, Layers, MessageCircle, MessageSquare, Music, Radio, RefreshCw, Send, Sparkles, Users, UsersRound, Video,
} from 'lucide-angular';
import { DashboardSummary } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Realtime Analytics & History</p>
          <h1>Workspace Dashboard</h1>
          <p class="page-subtitle">Real-time stats of your connected WhatsApp channel, broadcast volume, and message delivery records.</p>
        </div>
        <div class="heading-actions">
          <button class="button button-secondary" type="button" (click)="loadDashboard()" [disabled]="loading()">
            <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="loading()" />
            {{ loading() ? 'Updating…' : 'Refresh Data' }}
          </button>
          <a class="button button-primary" routerLink="/messages/send">
            <lucide-angular [img]="Send" [size]="15" />Compose Broadcast
          </a>
        </div>
      </div>

      <!-- QUICK SHORTCUTS ROW -->
      <div class="shortcuts-grid">
        <a class="shortcut-card surface" routerLink="/messages/send">
          <span class="shortcut-icon green"><lucide-angular [img]="Send" [size]="18" /></span>
          <div class="shortcut-text">
            <strong>Send Broadcast</strong>
            <span>Multi-select 10-20 groups & media</span>
          </div>
        </a>
        <a class="shortcut-card surface" routerLink="/groups">
          <span class="shortcut-icon blue"><lucide-angular [img]="UsersRound" [size]="18" /></span>
          <div class="shortcut-text">
            <strong>WhatsApp Groups ({{ summary()?.totalGroups ?? 0 }})</strong>
            <span>Broadcast to multiple groups</span>
          </div>
        </a>
        <a class="shortcut-card surface" routerLink="/contacts">
          <span class="shortcut-icon purple"><lucide-angular [img]="ContactRound" [size]="18" /></span>
          <div class="shortcut-text">
            <strong>Contacts ({{ summary()?.totalContacts ?? 0 }})</strong>
            <span>Synced phone address book</span>
          </div>
        </a>
        <a class="shortcut-card surface" routerLink="/whatsapp">
          <span class="shortcut-icon" [class.green]="summary()?.whatsappStatus === 'connected'" [class.amber]="summary()?.whatsappStatus !== 'connected'">
            <lucide-angular [img]="Radio" [size]="18" />
          </span>
          <div class="shortcut-text">
            <strong>WhatsApp Channel</strong>
            <span class="status-badge-mini" [class.online]="summary()?.whatsappStatus === 'connected'">
              {{ summary()?.whatsappStatus === 'connected' ? 'Connected & Ready' : (summary()?.whatsappStatus || 'Disconnected') }}
            </span>
          </div>
        </a>
      </div>

      @if (error()) {
        <div class="connection-note">
          <lucide-angular [img]="CircleAlert" [size]="18" />
          <span>{{ error() }}</span>
        </div>
      }

      <!-- METRICS GRID -->
      <div class="metrics-grid">
        @for (metric of metrics(); track metric.label) {
          <article class="metric surface">
            <div class="metric-top">
              <span>{{ metric.label }}</span>
              <span class="metric-icon" [class]="metric.tone">
                <lucide-angular [img]="metric.icon" [size]="17" />
              </span>
            </div>
            <strong class="metric-value">{{ metric.value === null ? '0' : (metric.value | number) }}</strong>
            <span class="metric-foot">{{ metric.note }}</span>
          </article>
        }
      </div>

      <!-- MAIN CHARTS & STATUS ROW -->
      <div class="dashboard-grid">
        <!-- 7-DAY MESSAGE VOLUME CHART -->
        <section class="chart-panel surface">
          <div class="panel-heading">
            <div>
              <h2>Message Volume Activity</h2>
              <p>Outbound message deliveries over the past 7 days (Live & Persistent)</p>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><i class="sent-dot"></i>Sent Deliveries</span>
              <span class="legend-item"><i class="failed-dot"></i>Failed</span>
            </div>
          </div>

          @if (summary()?.messageVolume?.length) {
            <div class="chart-container">
              <div class="chart" role="img" aria-label="7-Day message volume activity chart">
                @for (day of summary()!.messageVolume; track day.date) {
                  <div class="chart-column">
                    <!-- COUNT BADGE ABOVE BARS -->
                    <div class="bar-counts-top">
                      @if (day.sent > 0 || day.failed > 0) {
                        <span class="count-tag-sent" [title]="day.sent + ' sent'">{{ day.sent }}</span>
                        @if (day.failed > 0) {
                          <span class="count-tag-failed" [title]="day.failed + ' failed'">{{ day.failed }}</span>
                        }
                      } @else {
                        <span class="count-tag-zero">0</span>
                      }
                    </div>

                    <!-- BARS -->
                    <div class="bar-pair">
                      <span
                        class="bar-sent"
                        [style.height.%]="barHeight(day.sent)"
                        [title]="day.sent + ' sent on ' + (day.dayLabel || day.date) + ' (' + day.date + ')'"
                      ></span>
                      <span
                        class="bar-failed"
                        [style.height.%]="barHeight(day.failed)"
                        [title]="day.failed + ' failed on ' + (day.dayLabel || day.date) + ' (' + day.date + ')'"
                      ></span>
                    </div>

                    <!-- DAY LABEL -->
                    <div class="day-label-group">
                      <strong class="day-name" [class.is-today]="day.dayLabel === 'Today'">
                        {{ day.dayLabel || (day.date | date:'EEE') }}
                      </strong>
                      <small class="day-date-mini">{{ day.date | date:'MMM d' }}</small>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (loading()) {
            <div class="chart-empty">Loading message activity analytics…</div>
          } @else {
            <div class="chart-empty">No message activity recorded in the last 7 days yet. Send messages to see stats!</div>
          }
        </section>

        <!-- WHATSAPP ENGINE CARD -->
        <section class="connection-panel surface">
          <div class="panel-heading">
            <div>
              <h2>WhatsApp Engine</h2>
              <p>Baileys Socket Service</p>
            </div>
            <span class="channel-icon">
              <lucide-angular [img]="Activity" [size]="18" />
            </span>
          </div>
          
          <div class="channel-state">
            <span class="channel-pulse" [class.is-online]="summary()?.whatsappStatus === 'connected'"></span>
            <strong>{{ summary()?.whatsappStatus === 'connected' ? 'WhatsApp Connected & Ready' : (summary()?.whatsappStatus || 'Disconnected') }}</strong>
          </div>
          
          <p class="channel-description">
            @if (summary()?.whatsappStatus === 'connected') {
              Baileys socket is actively running. Contacts and groups are synced with real-time broadcasting enabled.
            } @else {
              WhatsApp is disconnected. Your previous message history and delivery statistics remain fully preserved.
            }
          </p>

          <a class="button button-secondary channel-btn" routerLink="/whatsapp">
            Manage WhatsApp Connection <span>→</span>
          </a>
        </section>
      </div>

      <!-- RECENT ACTIVITY TABLE -->
      <section class="activity-panel surface">
        <div class="panel-heading">
          <div>
            <h2>Recent Outbound Messages</h2>
            <p>Persistent record of all sent messages, broadcasts, and media deliveries</p>
          </div>
          <a routerLink="/messages/send" class="text-link">Send New Broadcast <span>→</span></a>
        </div>

        @if (summary()?.latestMessages?.length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Recipient / Group</th>
                  <th>Message / Content</th>
                  <th>Status</th>
                  <th>Sent Timestamp</th>
                </tr>
              </thead>
              <tbody>
                @for (message of summary()!.latestMessages; track message.id) {
                  <tr>
                    <td>
                      <span class="recipient-badge">
                        <lucide-angular [img]="MessageSquare" [size]="14" />
                        <strong>{{ message.recipient }}</strong>
                      </span>
                    </td>
                    <td>
                      <div class="message-preview-cell">
                        @if (message.hasMedia) {
                          <span class="media-tag">
                            <lucide-angular [img]="FileImage" [size]="12" /> Media Attached
                          </span>
                        }
                        <span class="body-text">{{ message.body || 'No text content' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="status" [class]="'status-' + message.status">
                        {{ message.status }}
                      </span>
                    </td>
                    <td class="muted-cell">{{ message.createdAt | date:'medium' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="activity-empty">
            {{ loading() ? 'Loading activity…' : 'No messages sent yet. Use Compose Broadcast to send your first message!' }}
          </div>
        }
      </section>
    </section>
  `,
  styles: [`
    .heading-actions { display:flex; gap:10px; align-items:center; }
    .shortcuts-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:18px; }
    .shortcut-card { display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:9px; text-decoration:none; transition:transform 0.15s, border-color 0.15s; }
    .shortcut-card:hover { transform:translateY(-2px); border-color:var(--green); }
    .shortcut-icon { width:38px; height:38px; border-radius:8px; display:grid; place-items:center; flex:none; }
    .shortcut-icon.green { background:var(--green-wash); color:var(--green); }
    .shortcut-icon.blue { background:#e7f1fc; color:#1967d2; }
    .shortcut-icon.purple { background:#f1ebfa; color:#7839ee; }
    .shortcut-icon.amber { background:var(--amber-wash); color:var(--amber); }
    .shortcut-text { display:grid; gap:2px; }
    .shortcut-text strong { font-size:12px; color:var(--ink); font-family:Manrope,sans-serif; }
    .shortcut-text span { font-size:10px; color:var(--ink-soft); }
    .status-badge-mini { display:inline-block; font-weight:700; text-transform:capitalize; }
    .status-badge-mini.online { color:var(--green); }

    .metrics-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .metric { min-height:115px; padding:15px 16px 13px; }
    .metric-top { display:flex; align-items:center; justify-content:space-between; color:var(--ink-soft); font-size:11px; font-weight:600; }
    .metric-icon,.channel-icon { display:grid; width:31px; height:31px; place-items:center; border-radius:7px; background:var(--green-wash); color:var(--green); }
    .metric-icon.coral { background:var(--coral-wash); color:var(--coral); }
    .metric-icon.amber { background:var(--amber-wash); color:var(--amber); }
    .metric-value { display:block; margin:8px 0 3px; font-family:Manrope,sans-serif; font-size:26px; font-weight:700; color:var(--ink); }
    .metric-foot { color:var(--ink-faint); font-size:10px; }

    .dashboard-grid { display:grid; grid-template-columns:minmax(0,1.8fr) minmax(250px,.8fr); gap:14px; margin-top:16px; }
    .chart-panel,.connection-panel,.activity-panel { padding:18px; }
    .panel-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:12px; }
    .panel-heading h2 { margin:0 0 4px; font-size:15px; font-weight:800; color:var(--ink); }
    .panel-heading p { margin:0; color:var(--ink-soft); font-size:11px; }
    
    .chart-legend { display:flex; align-items:center; gap:14px; font-size:11px; font-weight:600; color:var(--ink-soft); }
    .legend-item { display:inline-flex; align-items:center; gap:6px; }
    .chart-legend i { width:9px; height:9px; border-radius:50%; }
    .chart-legend .sent-dot { background:var(--green); }
    .chart-legend .failed-dot { background:var(--coral); }

    .chart-container { margin-top:14px; padding-top:10px; }
    .chart { display:grid; height:200px; grid-template-columns:repeat(7,minmax(0,1fr)); align-items:end; gap:12px; border-bottom:1px solid var(--line); padding-bottom:6px; }
    .chart-column { display:grid; height:100%; grid-template-rows:22px 1fr 34px; justify-items:center; align-items:end; }
    
    .bar-counts-top { display:flex; gap:3px; font-size:10px; font-weight:800; align-items:center; }
    .count-tag-sent { color:var(--green); background:var(--green-wash); padding:1px 5px; border-radius:4px; }
    .count-tag-failed { color:var(--coral); background:var(--coral-wash); padding:1px 5px; border-radius:4px; }
    .count-tag-zero { color:var(--ink-faint); font-size:9px; }

    .bar-pair { display:flex; width:100%; height:100%; align-items:end; justify-content:center; gap:5px; padding:0 4px; }
    .bar-sent,.bar-failed { width:min(18px,45%); min-height:4px; border-radius:4px 4px 0 0; background:var(--green); transition:height .35s ease; cursor:pointer; }
    .bar-sent:hover { opacity:0.85; filter:brightness(1.1); }
    .bar-failed { background:var(--coral); }
    .bar-failed:hover { opacity:0.85; filter:brightness(1.1); }

    .day-label-group { display:flex; flex-direction:column; align-items:center; gap:1px; margin-top:6px; }
    .day-name { font-size:11px; font-weight:700; color:var(--ink-soft); }
    .day-name.is-today { color:var(--green); font-weight:800; }
    .day-date-mini { font-size:9px; color:var(--ink-faint); }
    
    .chart-empty { display:grid; height:194px; place-items:center; padding:20px; color:var(--ink-soft); font-size:12px; text-align:center; }

    .channel-state { display:flex; align-items:center; gap:9px; margin-top:20px; text-transform:capitalize; }
    .channel-state strong { font-family:Manrope,sans-serif; font-size:15px; color:var(--ink); }
    .channel-pulse { width:9px; height:9px; border-radius:50%; background:#88968d; box-shadow:0 0 0 4px rgba(136,150,141,0.2); }
    .channel-pulse.is-online { background:var(--green); box-shadow:0 0 0 4px var(--green-wash); }
    .channel-description { min-height:35px; margin:10px 0 17px; color:var(--ink-soft); font-size:11px; line-height:1.55; }
    .channel-btn { width:100%; font-size:11px; }
    .text-link { display:inline-flex; align-items:center; gap:7px; color:var(--green); font-size:11px; font-weight:700; }
    
    .activity-panel { margin-top:16px; }
    .activity-panel .panel-heading { margin-bottom:15px; }
    .recipient-badge { display:flex; align-items:center; gap:7px; font-weight:600; color:var(--ink); }
    .message-preview-cell { display:flex; align-items:center; gap:8px; max-width:340px; }
    .media-tag { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:800; color:var(--green); background:var(--green-wash); padding:2px 6px; border-radius:4px; flex-shrink:0; }
    .body-text { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--ink-soft); }
    .id-text { font-family:monospace; font-size:10px; color:var(--ink-soft); }
    .muted-cell { color:var(--ink-soft); font-size:11px; white-space:nowrap; }
    .activity-empty { display:grid; min-height:100px; place-items:center; color:var(--ink-soft); font-size:12px; }
    .connection-note { display:flex; align-items:center; gap:9px; margin:-11px 0 15px; border:1px solid var(--coral); border-radius:7px; background:var(--coral-wash); padding:10px 12px; color:var(--coral); font-size:12px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    @media(max-width:1100px) { .metrics-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } .shortcuts-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(max-width:760px) { .metrics-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; } .shortcuts-grid { grid-template-columns:1fr; } .dashboard-grid { grid-template-columns:1fr; } .chart-panel,.connection-panel,.activity-panel { padding:15px; } .chart { gap:7px; } }
    @media(max-width:420px) { .metric { min-height:105px; padding:12px; } .metric-value { font-size:22px; } }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly RefreshCw = RefreshCw;
  readonly Activity = Activity;
  readonly CircleAlert = CircleAlert;
  readonly Send = Send;
  readonly UsersRound = UsersRound;
  readonly ContactRound = ContactRound;
  readonly Radio = Radio;
  readonly MessageSquare = MessageSquare;
  readonly FileImage = FileImage;

  readonly metrics = signal([
    { label: 'Contacts', value: null as number | null, note: 'In your address book', tone: '', icon: ContactRound },
    { label: 'Groups', value: null as number | null, note: 'Synced WhatsApp groups', tone: '', icon: UsersRound },
    { label: 'Messages sent today', value: null as number | null, note: 'Outbound messages', tone: '', icon: Send },
    { label: 'Messages delivered', value: null as number | null, note: 'Delivery confirmed', tone: '', icon: ArrowUpRight },
    { label: 'Messages failed', value: null as number | null, note: 'Need your attention', tone: 'coral', icon: ArrowDownRight },
    { label: 'Media sent', value: null as number | null, note: 'Images, audio, videos & PDF', tone: '', icon: FileImage },
    { label: 'API usage', value: null as number | null, note: 'Total broadcast requests', tone: '', icon: BarChart3 },
    { label: 'Messages read', value: null as number | null, note: 'Read receipts received', tone: '', icon: MessageCircle },
  ]);

  ngOnInit(): void { this.loadDashboard(); }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get<DashboardSummary>('dashboard/summary').subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.metrics.update((cards) => cards.map((card) => ({ ...card, value: this.valueFor(card.label, summary) })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Dashboard data is unavailable. The backend dashboard endpoint must be connected.');
        this.loading.set(false);
      },
    });
  }

  barHeight(value: number): number {
    const volumes = this.summary()?.messageVolume.map((day) => day.sent + day.failed) || [1];
    const maximum = Math.max(...volumes, 1);
    return Math.max((value / maximum) * 85, value ? 10 : 3);
  }

  private valueFor(label: string, data: DashboardSummary): number | null {
    const values: Record<string, number> = {
      Contacts: data.totalContacts,
      Groups: data.totalGroups,
      'Messages sent today': data.messagesSentToday,
      'Messages delivered': data.messagesDelivered,
      'Messages failed': data.messagesFailed,
      'Media sent': data.mediaSent,
      'API usage': data.apiUsage,
      'Messages read': data.messagesRead,
    };
    return values[label] ?? null;
  }
}
