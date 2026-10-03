import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Calendar, CheckCircle2,
  CircleAlert, Download, FileImage, FileText, LucideAngularModule,
  MessageCircle, MessageSquare, Music, RefreshCw, Send, Video, Zap
} from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reports-shell',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <!-- HEADER -->
      <div class="page-heading">
        <div>
          <p class="eyebrow">Intelligence & Performance</p>
          <h1>Delivery Reports & Analytics</h1>
          <p class="page-subtitle">Track outbound broadcast delivery rates, audience engagement, media usage, and volume trends.</p>
        </div>
        <div class="heading-actions">
          <button class="button button-secondary" type="button" (click)="loadReports()" [disabled]="loading()">
            <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="loading()" />
            {{ loading() ? 'Updating…' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- FILTER TOOLBAR -->
      <div class="filter-toolbar surface">
        <div class="date-group">
          <label class="filter-label">
            <lucide-angular [img]="Calendar" [size]="14" />
            <span>From:</span>
            <input type="date" class="control date-input" [value]="dateFrom()" (change)="dateFrom.set(getVal($event))" />
          </label>
          <label class="filter-label">
            <lucide-angular [img]="Calendar" [size]="14" />
            <span>To:</span>
            <input type="date" class="control date-input" [value]="dateTo()" (change)="dateTo.set(getVal($event))" />
          </label>
          <button class="button button-secondary apply-btn" type="button" (click)="loadReports()">Apply Filter</button>
        </div>

        <div class="search-wrap">
          <input
            type="text"
            class="control search-input"
            placeholder="Search by recipient or phone..."
            (input)="onSearch($event)"
          />
        </div>
      </div>

      <!-- 4 TOP METRICS -->
      <div class="metrics-grid">
        <article class="metric surface">
          <div class="metric-top">
            <span>Total Outbound Sent</span>
            <span class="metric-icon"><lucide-angular [img]="Send" [size]="17" /></span>
          </div>
          <strong class="metric-value">{{ reportData()?.summary?.totalSent || 0 | number }}</strong>
          <span class="metric-foot">Broadcast & individual deliveries</span>
        </article>

        <article class="metric surface">
          <div class="metric-top">
            <span>Delivery Success Rate</span>
            <span class="metric-icon"><lucide-angular [img]="ArrowUpRight" [size]="17" /></span>
          </div>
          <strong class="metric-value rate-green">{{ reportData()?.summary?.deliveryRate || '100%' }}</strong>
          <span class="metric-foot">Successful socket acknowledgments</span>
        </article>

        <article class="metric surface">
          <div class="metric-top">
            <span>Failed Deliveries</span>
            <span class="metric-icon coral"><lucide-angular [img]="ArrowDownRight" [size]="17" /></span>
          </div>
          <strong class="metric-value rate-coral">{{ reportData()?.summary?.totalFailed || 0 | number }}</strong>
          <span class="metric-foot">Unreachable or invalid numbers</span>
        </article>

        <article class="metric surface">
          <div class="metric-top">
            <span>Media Files Sent</span>
            <span class="metric-icon blue"><lucide-angular [img]="FileImage" [size]="17" /></span>
          </div>
          <strong class="metric-value">{{ reportData()?.summary?.mediaSent || 0 | number }}</strong>
          <span class="metric-foot">Photos, Audio, Video & PDF</span>
        </article>
      </div>

      <!-- 7-DAY DELIVERY VOLUME TREND -->
      <section class="trend-panel surface">
        <div class="panel-heading">
          <div>
            <h2>7-Day Delivery Volume Trend</h2>
            <p>Historical comparison of successful vs failed dispatches</p>
          </div>
          <div class="trend-legend">
            <span class="legend-dot green"></span> Sent
            <span class="legend-dot red"></span> Failed
          </div>
        </div>

        @if (reportData()?.volumeTrend?.length) {
          <div class="chart-box">
            @for (day of reportData()!.volumeTrend; track day.date) {
              <div class="trend-col">
                <span class="col-count">{{ day.sent }}</span>
                <div class="trend-bars">
                  <span class="t-bar-sent" [style.height.%]="getBarHeight(day.sent)"></span>
                  <span class="t-bar-failed" [style.height.%]="getBarHeight(day.failed)"></span>
                </div>
                <strong class="col-label">{{ day.dayLabel || (day.date | date:'EEE') }}</strong>
                <small class="col-date">{{ day.date | date:'MMM d' }}</small>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">No volume recorded in this time range.</div>
        }
      </section>

      <!-- DETAILED DELIVERY LOGS -->
      <section class="records-panel surface">
        <div class="panel-heading">
          <div>
            <h2>Detailed Message Dispatch Records</h2>
            <p>Individual delivery receipts and timestamps</p>
          </div>
          <span class="total-badge">{{ reportData()?.items?.length || 0 }} records found</span>
        </div>

        @if (error()) {
          <div class="empty-state error-state">{{ error() }}</div>
        } @else if (loading()) {
          <div class="empty-state">Loading delivery records…</div>
        } @else if (!reportData()?.items?.length) {
          <div class="empty-state">No message records found for the selected filter.</div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Message / Content</th>
                  <th>Status</th>
                  <th>Delivered Timestamp</th>
                </tr>
              </thead>
              <tbody>
                @for (item of reportData()!.items; track item.id) {
                  <tr>
                    <td>
                      <span class="rec-pill">
                        <lucide-angular [img]="MessageSquare" [size]="13" />
                        <strong>{{ item.recipient }}</strong>
                      </span>
                    </td>
                    <td>
                      <div class="content-cell">
                        @if (item.hasMedia) {
                          <span class="media-badge">Media</span>
                        }
                        <span class="body-snippet">{{ item.bodySnippet || 'Outbound broadcast message' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="status" [class]="'status-' + item.status">{{ item.status }}</span>
                    </td>
                    <td class="muted-cell">{{ item.createdAt | date:'medium' }}</td>
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
    .heading-actions { display: flex; gap: 10px; align-items: center; }
    
    .filter-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .date-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--ink-soft); }
    .date-input { height: 34px; padding: 0 8px; font-size: 11px; width: 140px; }
    .apply-btn { height: 34px; font-size: 11px; padding: 0 12px; }
    .search-input { width: 260px; height: 34px; font-size: 12px; }

    .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
    .metric { min-height: 115px; padding: 15px 16px 13px; }
    .metric-top { display: flex; align-items: center; justify-content: space-between; color: var(--ink-soft); font-size: 11px; font-weight: 600; }
    .metric-icon { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 8px; background: var(--green-wash); color: var(--green); }
    .metric-icon.coral { background: var(--coral-wash); color: var(--coral); }
    .metric-icon.blue { background: rgba(56, 189, 248, 0.15); color: #0284c7; }
    .metric-value { display: block; margin: 8px 0 3px; font-family: Manrope, sans-serif; font-size: 26px; font-weight: 700; color: var(--ink); }
    .rate-green { color: var(--green); }
    .rate-coral { color: var(--coral); }
    .metric-foot { color: var(--ink-faint); font-size: 10px; }

    .trend-panel, .records-panel { padding: 20px; border-radius: 12px; margin-bottom: 18px; }
    .panel-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .panel-heading h2 { font-size: 15px; font-weight: 800; color: var(--ink); margin: 0 0 3px; }
    .panel-heading p { font-size: 11px; color: var(--ink-soft); margin: 0; }
    
    .trend-legend { display: flex; align-items: center; gap: 12px; font-size: 11px; color: var(--ink-soft); font-weight: 600; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .legend-dot.green { background: var(--green); }
    .legend-dot.red { background: var(--coral); }

    .chart-box { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; height: 180px; align-items: end; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
    .trend-col { display: grid; height: 100%; grid-template-rows: 20px 1fr 34px; justify-items: center; align-items: end; }
    .col-count { font-size: 10px; font-weight: 800; color: var(--green); }
    .trend-bars { display: flex; align-items: end; gap: 4px; height: 100%; width: 100%; justify-content: center; }
    .t-bar-sent { width: min(16px, 45%); min-height: 4px; border-radius: 4px 4px 0 0; background: var(--green); }
    .t-bar-failed { width: min(16px, 45%); min-height: 4px; border-radius: 4px 4px 0 0; background: var(--coral); }
    .col-label { font-size: 11px; font-weight: 700; color: var(--ink); margin-top: 4px; }
    .col-date { font-size: 9px; color: var(--ink-faint); }

    .total-badge { background: var(--surface-muted); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--ink-soft); border: 1px solid var(--line); }
    .rec-pill { display: inline-flex; align-items: center; gap: 6px; color: var(--ink); }
    .content-cell { display: flex; align-items: center; gap: 8px; max-width: 320px; }
    .media-badge { background: var(--green-wash); color: var(--green); font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 4px; flex-shrink: 0; }
    .body-snippet { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: var(--ink-soft); }
    .muted-cell { color: var(--ink-faint); font-size: 11px; }

    .empty-state { display: grid; min-height: 120px; place-items: center; color: var(--ink-soft); font-size: 12px; text-align: center; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .filter-toolbar { flex-direction: column; align-items: stretch; }
      .search-input { width: 100%; }
    }
  `],
})
export class ReportsShellComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly reportData = signal<any>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly RefreshCw = RefreshCw;
  readonly Send = Send;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ArrowDownRight = ArrowDownRight;
  readonly FileImage = FileImage;
  readonly Calendar = Calendar;
  readonly MessageSquare = MessageSquare;

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(search?: string): void {
    this.loading.set(true);
    this.error.set('');

    const query: Record<string, string | number> = { limit: 100 };
    if (this.dateFrom()) query['dateFrom'] = this.dateFrom();
    if (this.dateTo()) query['dateTo'] = this.dateTo();
    if (search) query['search'] = search;

    this.api.get<any>('reports', query).subscribe({
      next: (res) => {
        this.reportData.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load reports data.');
        this.loading.set(false);
      },
    });
  }

  getVal(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.trim();
    this.loadReports(term);
  }

  getBarHeight(val: number): number {
    const trend = this.reportData()?.volumeTrend || [];
    const max = Math.max(...trend.map((t: any) => t.sent + t.failed), 1);
    return Math.max((val / max) * 85, val ? 10 : 2);
  }
}
