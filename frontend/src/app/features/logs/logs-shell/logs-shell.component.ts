import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  Activity, AlertCircle, ArrowDownRight, ArrowUpRight, CheckCircle2,
  Clock, FileImage, FileText, Filter, LucideAngularModule,
  MessageSquare, Music, RefreshCw, Search, Send, ShieldAlert,
  SlidersHorizontal, Video, Zap
} from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-logs-shell',
  standalone: true,
  imports: [DatePipe, DecimalPipe, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <!-- HEADER -->
      <div class="page-heading">
        <div>
          <p class="eyebrow">Audit & System Stream</p>
          <h1>Real-Time Activity & Audit Logs</h1>
          <p class="page-subtitle">Inspect outbound transmissions, delivery acknowledgments, system events, and error diagnostics.</p>
        </div>
        <div class="heading-actions">
          <span class="live-pill">
            <span class="live-pulse"></span>
            LIVE STREAM
          </span>
          <button class="button button-secondary" type="button" (click)="loadLogs()" [disabled]="loading()">
            <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="loading()" />
            {{ loading() ? 'Syncing…' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- SUMMARY KPI METRICS -->
      <div class="log-metrics-grid">
        <article class="l-metric surface" [class.active-card]="statusFilter() === ''" (click)="setStatusFilter('')">
          <div class="l-metric-hdr">
            <span>Total Events</span>
            <span class="l-icon"><lucide-angular [img]="Activity" [size]="16" /></span>
          </div>
          <strong class="l-value">{{ logData()?.summary?.totalEvents || 0 | number }}</strong>
          <span class="l-sub">All system activities</span>
        </article>

        <article class="l-metric surface" [class.active-card]="statusFilter() === 'delivered'" (click)="setStatusFilter('delivered')">
          <div class="l-metric-hdr">
            <span>Delivered</span>
            <span class="l-icon green"><lucide-angular [img]="CheckCircle2" [size]="16" /></span>
          </div>
          <strong class="l-value l-green">{{ logData()?.summary?.delivered || 0 | number }}</strong>
          <span class="l-sub">Confirmed receipts</span>
        </article>

        <article class="l-metric surface" [class.active-card]="statusFilter() === 'sent'" (click)="setStatusFilter('sent')">
          <div class="l-metric-hdr">
            <span>In Flight / Sent</span>
            <span class="l-icon blue"><lucide-angular [img]="Send" [size]="16" /></span>
          </div>
          <strong class="l-value l-blue">{{ logData()?.summary?.sent || 0 | number }}</strong>
          <span class="l-sub">Socket dispatches</span>
        </article>

        <article class="l-metric surface" [class.active-card]="statusFilter() === 'failed'" (click)="setStatusFilter('failed')">
          <div class="l-metric-hdr">
            <span>Failed / Errors</span>
            <span class="l-icon coral"><lucide-angular [img]="AlertCircle" [size]="16" /></span>
          </div>
          <strong class="l-value l-coral">{{ logData()?.summary?.failed || 0 | number }}</strong>
          <span class="l-sub">Transmission errors</span>
        </article>
      </div>

      <!-- FILTER CONTROLS & SEARCH BAR -->
      <div class="filter-card surface">
        <div class="pills-group">
          <button
            type="button"
            class="pill-btn"
            [class.pill-active]="statusFilter() === ''"
            (click)="setStatusFilter('')"
          >
            All Logs ({{ logData()?.summary?.totalEvents || 0 }})
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.pill-active]="statusFilter() === 'delivered'"
            (click)="setStatusFilter('delivered')"
          >
            <span class="dot green-dot"></span>
            Delivered
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.pill-active]="statusFilter() === 'sent'"
            (click)="setStatusFilter('sent')"
          >
            <span class="dot blue-dot"></span>
            Sent
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.pill-active]="statusFilter() === 'failed'"
            (click)="setStatusFilter('failed')"
          >
            <span class="dot coral-dot"></span>
            Failed
          </button>
        </div>

        <div class="search-wrap">
          <lucide-angular [img]="Search" [size]="15" class="search-icon" />
          <input
            type="text"
            class="control search-input"
            placeholder="Search recipient, message text, or event..."
            (input)="onSearch($event)"
          />
        </div>
      </div>

      <!-- LOG STREAM TABLE -->
      <section class="logs-container surface">
        <div class="logs-header">
          <div>
            <h2>Activity Stream</h2>
            <p>Chronological records of outbound communications and message states</p>
          </div>
          <span class="records-badge">{{ logData()?.items?.length || 0 }} events found</span>
        </div>

        @if (error()) {
          <div class="empty-state error-state">{{ error() }}</div>
        } @else if (loading()) {
          <div class="empty-state">Loading activity logs…</div>
        } @else if (!logData()?.items?.length) {
          <div class="empty-state">
            <lucide-angular [img]="Activity" [size]="32" class="empty-icon" />
            <p>No activity logs found for the selected criteria.</p>
          </div>
        } @else {
          <div class="table-wrap">
            <table class="logs-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Recipient / Target</th>
                  <th>Content / Payload</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                @for (log of logData()!.items; track log.id) {
                  <tr class="log-row">
                    <td>
                      <div class="event-type-cell">
                        @if (log.status === 'delivered') {
                          <span class="event-icon-box e-green">
                            <lucide-angular [img]="CheckCircle2" [size]="14" />
                          </span>
                        } @else if (log.status === 'failed') {
                          <span class="event-icon-box e-coral">
                            <lucide-angular [img]="AlertCircle" [size]="14" />
                          </span>
                        } @else {
                          <span class="event-icon-box e-blue">
                            <lucide-angular [img]="Send" [size]="14" />
                          </span>
                        }
                        <div class="event-meta">
                          <strong class="event-title">{{ log.eventType || 'Message Dispatch' }}</strong>
                          <span class="event-id">ID: {{ log.id.substring(0, 8) }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="recipient-badge">
                        <lucide-angular [img]="MessageSquare" [size]="13" />
                        <strong>{{ log.recipient }}</strong>
                      </span>
                    </td>
                    <td>
                      <div class="payload-cell">
                        @if (log.hasMedia) {
                          <span class="media-tag">
                            <lucide-angular [img]="FileImage" [size]="11" />
                            Media Attached
                          </span>
                        }
                        <span class="msg-snippet" [title]="log.bodySnippet || ''">
                          {{ log.bodySnippet || 'Outbound broadcast delivery' }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span class="status" [class]="'status-' + log.status">
                        {{ log.status }}
                      </span>
                    </td>
                    <td class="time-cell">
                      <span class="time-main">{{ log.createdAt | date:'medium' }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </section>
  `,
  styles: [`
    .heading-actions { display: flex; align-items: center; gap: 12px; }
    
    .live-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      background: rgba(16, 185, 129, 0.12);
      color: var(--green);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .live-pulse {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .log-metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .l-metric {
      padding: 14px 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--line);
    }
    .l-metric:hover { transform: translateY(-2px); border-color: rgba(16, 185, 129, 0.3); }
    .l-metric.active-card {
      border-color: var(--green);
      background: linear-gradient(180deg, var(--surface) 0%, rgba(16, 185, 129, 0.05) 100%);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.1);
    }
    .l-metric-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--ink-soft);
      font-size: 11px;
      font-weight: 700;
    }
    .l-icon {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: grid;
      place-items: center;
      background: var(--surface-muted);
      color: var(--ink-soft);
    }
    .l-icon.green { background: var(--green-wash); color: var(--green); }
    .l-icon.blue { background: rgba(56, 189, 248, 0.15); color: #0284c7; }
    .l-icon.coral { background: var(--coral-wash); color: var(--coral); }
    
    .l-value {
      display: block;
      margin: 8px 0 2px;
      font-family: Manrope, sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: var(--ink);
    }
    .l-green { color: var(--green); }
    .l-blue { color: #0284c7; }
    .l-coral { color: var(--coral); }
    .l-sub { font-size: 10px; color: var(--ink-faint); }

    .filter-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 18px;
      border-radius: 12px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .pills-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-muted);
      border: 1px solid var(--line);
      color: var(--ink-soft);
      font-size: 11px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pill-btn:hover { background: var(--line); color: var(--ink); }
    .pill-btn.pill-active {
      background: var(--green-wash);
      color: var(--green);
      border-color: rgba(16, 185, 129, 0.4);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .green-dot { background: var(--green); }
    .blue-dot { background: #0284c7; }
    .coral-dot { background: var(--coral); }

    .search-wrap { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 10px; color: var(--ink-faint); pointer-events: none; }
    .search-input { width: 300px; height: 36px; padding-left: 32px; font-size: 12px; border-radius: 8px; }

    .logs-container { padding: 20px; border-radius: 12px; }
    .logs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .logs-header h2 { font-size: 15px; font-weight: 800; color: var(--ink); margin: 0 0 3px; }
    .logs-header p { font-size: 11px; color: var(--ink-soft); margin: 0; }
    .records-badge {
      background: var(--surface-muted);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-soft);
      border: 1px solid var(--line);
    }

    .logs-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .logs-table th { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft); padding: 10px 14px; border-bottom: 1px solid var(--line); text-align: left; }
    .logs-table td { padding: 12px 14px; border-bottom: 1px solid var(--line); font-size: 12px; vertical-align: middle; }
    .log-row:hover { background: var(--surface-muted); }

    .event-type-cell { display: flex; align-items: center; gap: 10px; }
    .event-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .e-green { background: var(--green-wash); color: var(--green); }
    .e-coral { background: var(--coral-wash); color: var(--coral); }
    .e-blue { background: rgba(56, 189, 248, 0.15); color: #0284c7; }

    .event-meta { display: flex; flex-direction: column; }
    .event-title { font-size: 12px; font-weight: 800; color: var(--ink); }
    .event-id { font-size: 10px; color: var(--ink-faint); }

    .recipient-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--ink);
      font-size: 12px;
    }

    .payload-cell { display: flex; align-items: center; gap: 8px; max-width: 320px; }
    .media-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--green-wash);
      color: var(--green);
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .msg-snippet { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--ink-soft); }

    .time-cell { color: var(--ink-soft); font-size: 11px; white-space: nowrap; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      color: var(--ink-soft);
      font-size: 13px;
      gap: 8px;
    }
    .empty-icon { color: var(--ink-faint); margin-bottom: 4px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .log-metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .filter-card { flex-direction: column; align-items: stretch; }
      .search-input { width: 100%; }
    }
  `],
})
export class LogsShellComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly logData = signal<any>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly statusFilter = signal('');
  readonly searchTerm = signal('');

  readonly Activity = Activity;
  readonly CheckCircle2 = CheckCircle2;
  readonly Send = Send;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly MessageSquare = MessageSquare;
  readonly FileImage = FileImage;

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set('');

    const query: Record<string, string | number> = { limit: 100 };
    if (this.statusFilter()) query['status'] = this.statusFilter();
    if (this.searchTerm()) query['search'] = this.searchTerm();

    this.api.get<any>('logs', query).subscribe({
      next: (res) => {
        this.logData.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load activity logs from server.');
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.loadLogs();
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim();
    this.searchTerm.set(val);
    this.loadLogs();
  }
}
