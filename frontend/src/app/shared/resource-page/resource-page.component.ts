import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Activity, BarChart3, CircleAlert, FileImage, LucideAngularModule, RefreshCw, Search, Settings } from 'lucide-angular';
import { PageResult } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';

type ResourceKind = 'media' | 'reports' | 'logs' | 'settings';
type ResourceRow = Record<string, unknown>;

const RESOURCE_DETAILS: Record<ResourceKind, { title: string; subtitle: string; endpoint: string }> = {
  media: { title: 'Media library', subtitle: 'Files stored for your workspace.', endpoint: 'media' },
  reports: { title: 'Reports', subtitle: 'Review delivery, campaign and usage data.', endpoint: 'reports/messages' },
  logs: { title: 'Activity logs', subtitle: 'Review message and system events for your workspace.', endpoint: 'logs/messages' },
  settings: { title: 'Settings', subtitle: 'Manage account and workspace preferences.', endpoint: 'settings/profile' },
};

@Component({
  selector: 'app-resource-page',
  standalone: true,
  imports: [DatePipe, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading"><div><p class="eyebrow">{{ kindLabel() }}</p><h1>{{ title() }}</h1><p class="page-subtitle">{{ subtitle() }}</p></div><button class="button button-secondary" type="button" (click)="loadRows()" [disabled]="loading()"><lucide-angular [img]="RefreshCw" [size]="15" />Refresh</button></div>
      @if (kind() === 'settings') {
        <nav class="settings-tabs surface" aria-label="Settings sections"><a routerLink="/settings/profile" routerLinkActive="tab-active">Profile</a><a routerLink="/settings/users" routerLinkActive="tab-active">Users</a><a routerLink="/settings/security" routerLinkActive="tab-active">Security</a><a routerLink="/settings/api" routerLinkActive="tab-active">API</a></nav>
      }
      <section class="resource-panel surface">
        <div class="resource-toolbar">
          <label class="search-field"><lucide-angular [img]="Search" [size]="16" /><input [value]="search()" (input)="updateSearch($event)" placeholder="Search records" aria-label="Search records"></label>
          @if (kind() === 'reports') { <div class="date-filters"><label>From<input type="date" [value]="dateFrom()" (change)="dateFrom.set(inputValue($event))"></label><label>To<input type="date" [value]="dateTo()" (change)="dateTo.set(inputValue($event))"></label><button class="button button-secondary" type="button" (click)="loadRows()">Apply</button></div> }
        </div>
        @if (error()) { <div class="resource-state error-state"><span class="state-icon"><lucide-angular [img]="CircleAlert" [size]="18" /></span><strong>Could not load {{ title().toLowerCase() }}</strong><span>{{ error() }}</span></div> }
        @else if (loading()) { <div class="resource-state">Loading {{ title().toLowerCase() }}…</div> }
        @else if (!visibleRows().length) { <div class="resource-state"><span class="state-icon"><lucide-angular [img]="pageIcon()" [size]="18" /></span><strong>{{ search() ? 'No matching records' : 'Nothing here yet' }}</strong><span>{{ search() ? 'Try a different search.' : emptyMessage() }}</span></div> }
        @else {
          <div class="table-wrap"><table><thead><tr>@for (column of columns(); track column) { <th>{{ formatLabel(column) }}</th> }</tr></thead><tbody>
            @for (row of visibleRows(); track row['id'] || $index) { <tr>@for (column of columns(); track column) { <td>{{ displayValue(row[column]) }}</td> }</tr> }
          </tbody></table></div>
          <div class="resource-footer"><span>{{ total() ?? visibleRows().length }} records</span><div class="pagination"><button class="button button-secondary" type="button" (click)="loadPrevious()" [disabled]="!previousCursor() || loading()">Previous</button><button class="button button-secondary" type="button" (click)="loadNext()" [disabled]="!nextCursor() || loading()">Next</button></div></div>
        }
      </section>
    </section>
  `,
  styles: [`
    .resource-panel { overflow:hidden; }
    .resource-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; }
    .search-field { display:flex; width:min(100%,320px); height:37px; align-items:center; gap:8px; border:1px solid #e3e8e2; border-radius:6px; padding:0 10px; color:#8a948d; }
    .search-field input { width:100%; border:0; outline:0; color:#29352d; font-size:12px; }
    .date-filters { display:flex; align-items:center; gap:8px; }
    .date-filters label { display:flex; align-items:center; gap:5px; color:#839087; font-size:10px; }
    .date-filters input { height:34px; border:1px solid #e3e8e2; border-radius:5px; padding:0 7px; color:#364239; font:inherit; }
    .resource-state { display:grid; min-height:260px; place-content:center; justify-items:center; gap:9px; padding:28px; color:#89938c; font-size:12px; text-align:center; }
    .resource-state strong { color:#39463d; font-family:Manrope,sans-serif; font-size:14px; }
    .resource-state>span:last-child { max-width:380px; line-height:1.55; }
    .state-icon { display:grid; width:39px; height:39px; place-items:center; border-radius:50%; background:#e6f2eb; color:#176b4a; }
    .error-state { color:#a95443; }
    .resource-footer { display:flex; min-height:55px; align-items:center; justify-content:space-between; border-top:1px solid #e6eae4; padding:8px 15px; color:#8b958e; font-size:11px; }
    .pagination { display:flex; gap:7px; }
    .pagination .button { min-height:31px; padding:0 10px; font-size:10px; }
    .settings-tabs { display:flex; gap:3px; margin-bottom:14px; padding:5px; }
    .settings-tabs a { border-radius:5px; padding:9px 13px; color:#748078; font-size:11px; font-weight:700; }
    .settings-tabs a:hover,.settings-tabs .tab-active { background:#e6f2eb; color:#176b4a; }
    @media(max-width:680px) { .resource-toolbar { align-items:stretch; flex-direction:column; } .search-field { width:100%; } .date-filters { flex-wrap:wrap; } .resource-footer { align-items:flex-start; flex-direction:column; gap:8px; } .settings-tabs { overflow:auto; } .settings-tabs a { flex:none; } }
  `],
})
export class ResourcePageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly resourceKey = input<ResourceKind>('media');
  readonly kind = computed(() => this.resourceKey());
  readonly title = computed(() => RESOURCE_DETAILS[this.kind()].title);
  readonly subtitle = computed(() => RESOURCE_DETAILS[this.kind()].subtitle);
  readonly kindLabel = computed(() => this.kind() === 'settings' ? 'Workspace' : 'Operations');
  readonly pageIcon = computed(() => ({ media: FileImage, reports: BarChart3, logs: Activity, settings: Settings })[this.kind()]);
  readonly rows = signal<ResourceRow[]>([]);
  readonly visibleRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter((row) => Object.values(row).some((value) => this.displayValue(value).toLowerCase().includes(term)));
  });
  readonly columns = computed(() => Object.keys(this.visibleRows()[0] || {}).filter((key) => !['tenantId', 'deletedAt', 'updatedAt'].includes(key)));
  readonly loading = signal(true);
  readonly error = signal('');
  readonly search = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly total = signal<number | null>(null);
  readonly nextCursor = signal<string | null>(null);
  readonly previousCursor = signal<string | null>(null);
  readonly RefreshCw = RefreshCw;
  readonly Search = Search;
  readonly CircleAlert = CircleAlert;
  private currentCursor: string | null = null;

  ngOnInit(): void { this.loadRows(); }

  loadRows(): void {
    this.loading.set(true);
    this.error.set('');
    const reportType = location.pathname.split('/')[2];
    const settingsSection = location.pathname.split('/')[2] || 'profile';
    let endpoint = RESOURCE_DETAILS[this.kind()].endpoint;
    if (this.kind() === 'reports' && reportType) endpoint = `reports/${encodeURIComponent(reportType)}`;
    if (this.kind() === 'logs' && reportType) endpoint = `logs/${encodeURIComponent(reportType)}`;
    if (this.kind() === 'settings') endpoint = `settings/${encodeURIComponent(settingsSection)}`;

    const query: Record<string, string | number> = { limit: 25 };
    if (this.search()) query['search'] = this.search();
    if (this.currentCursor) query['cursor'] = this.currentCursor;
    if (this.dateFrom()) query['dateFrom'] = this.dateFrom();
    if (this.dateTo()) query['dateTo'] = this.dateTo();

    this.api.get<PageResult<ResourceRow>>(endpoint, query).subscribe({
      next: (result) => {
        this.rows.set(result.items || []);
        this.total.set(result.total ?? null);
        this.nextCursor.set(result.nextCursor ?? null);
        this.previousCursor.set(this.currentCursor);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.error.set(`${this.title()} data is not available from the backend yet.`);
        this.loading.set(false);
      },
    });
  }

  updateSearch(event: Event): void { this.search.set((event.target as HTMLInputElement).value); this.loadRows(); }
  inputValue(event: Event): string { return (event.target as HTMLInputElement).value; }
  loadNext(): void { this.currentCursor = this.nextCursor(); this.loadRows(); }
  loadPrevious(): void { this.currentCursor = null; this.loadRows(); }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  emptyMessage(): string {
    const messages: Record<ResourceKind, string> = {
      media: 'Upload files to the object storage service to see them here.',
      reports: 'Reports appear after messages have been processed.',
      logs: 'Activity appears after workspace actions are recorded.',
      settings: 'Workspace preferences will appear here when available.',
    };
    return messages[this.kind()];
  }
}