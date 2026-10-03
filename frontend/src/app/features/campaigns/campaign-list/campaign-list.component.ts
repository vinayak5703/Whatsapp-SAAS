import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CircleAlert, LucideAngularModule, Megaphone, Plus, RefreshCw } from 'lucide-angular';
import { Campaign, PageResult } from '../../../core/models/api.models';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [DatePipe, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading"><div><p class="eyebrow">Messaging</p><h1>{{ pageTitle() }}</h1><p class="page-subtitle">Create and monitor messages sent to your audience.</p></div><a class="button button-primary" routerLink="/campaigns/new"><lucide-angular [img]="Plus" [size]="16" />Create campaign</a></div>
      @if (notice()) { <div class="notice">{{ notice() }}</div> }
      <section class="campaign-panel surface">
        <div class="panel-top"><div><strong>{{ campaigns().length }} campaigns</strong><span>Synced from your workspace</span></div><button class="button button-secondary" type="button" (click)="loadCampaigns()" [disabled]="loading()"><lucide-angular [img]="RefreshCw" [size]="15" />Refresh</button></div>
        @if (error()) { <div class="list-state error-state"><lucide-angular [img]="CircleAlert" [size]="20" /><strong>Campaigns could not be loaded</strong><span>{{ error() }}</span></div> }
        @else if (loading()) { <div class="list-state">Loading campaigns…</div> }
        @else if (!campaigns().length) { <div class="list-state"><span class="empty-icon"><lucide-angular [img]="Megaphone" [size]="20" /></span><strong>No campaigns yet</strong><span>Create a campaign to send messages through your connected WhatsApp channel.</span><a class="button button-primary" routerLink="/campaigns/new"><lucide-angular [img]="Plus" [size]="15" />Create campaign</a></div> }
        @else {
          <div class="table-wrap"><table><thead><tr><th>Campaign</th><th>Status</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Created</th><th>Actions</th></tr></thead><tbody>
            @for (campaign of campaigns(); track campaign.id) {
              <tr><td><strong>{{ campaign.name }}</strong></td><td><span class="status" [class]="'status-' + campaign.status">{{ campaign.status }}</span></td><td>{{ campaign.recipientCount }}</td><td>{{ campaign.sentCount }}</td><td>{{ campaign.failedCount }}</td><td class="muted-cell">{{ campaign.createdAt | date:'mediumDate' }}</td><td><button class="row-button" type="button" [disabled]="actionCampaignId() === campaign.id" (click)="changeStatus(campaign)">{{ actionName(campaign.status) }}</button></td></tr>
            }
          </tbody></table></div>
          <div class="list-footer">{{ total() ?? campaigns().length }} campaigns</div>
        }
      </section>
    </section>
  `,
  styles: [`
    .campaign-panel { overflow:hidden; }
    .panel-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; }
    .panel-top div { display:grid; gap:4px; }
    .panel-top strong { font-size:12px; }
    .panel-top span,.muted-cell { color:#89938c; font-size:11px; }
    .list-state { display:grid; min-height:270px; place-content:center; justify-items:center; gap:9px; padding:28px; color:#8e9991; font-size:12px; text-align:center; }
    .list-state strong { color:#39463d; font-family:Manrope,sans-serif; font-size:14px; }
    .list-state span { max-width:360px; line-height:1.5; }
    .error-state { color:#ae5a49; }
    .empty-icon { display:grid; width:39px; height:39px; place-items:center; border-radius:50%; background:#e6f2eb; color:#176b4a; }
    .row-button { border:0; background:none; color:#176b4a; font-size:11px; font-weight:700; }
    .row-button:disabled { opacity:.5; }
    .list-footer { border-top:1px solid #e6eae4; padding:15px; color:#8b958e; font-size:11px; }
    .notice { margin:-10px 0 15px; border:1px solid #d9e9de; border-radius:6px; background:#f3faf5; padding:10px 12px; color:#176b4a; font-size:12px; }
    @media(max-width:650px) { .panel-top { align-items:flex-start; flex-direction:column; } }
  `],
})
export class CampaignListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  readonly campaigns = signal<Campaign[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly total = signal<number | null>(null);
  readonly actionCampaignId = signal<string | null>(null);
  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly CircleAlert = CircleAlert;
  readonly Megaphone = Megaphone;
  readonly pageTitle = signal('Campaigns');

  ngOnInit(): void {
    this.pageTitle.set(this.route.snapshot.url.some((part) => part.path === 'bulk') ? 'Bulk messaging' : 'Campaigns');
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get<PageResult<Campaign>>('campaigns', { limit: 25 }).subscribe({
      next: (result) => { this.campaigns.set(result.items); this.total.set(result.total ?? null); this.loading.set(false); },
      error: () => { this.error.set('Connect the campaigns API to view campaign data.'); this.loading.set(false); },
    });
  }

  actionName(status: string): string {
    if (status === 'paused') return 'Resume';
    if (status === 'running' || status === 'queued') return 'Pause';
    return 'Start';
  }

  changeStatus(campaign: Campaign): void {
    const action = campaign.status === 'paused' ? 'resume' : campaign.status === 'running' || campaign.status === 'queued' ? 'pause' : 'start';
    this.actionCampaignId.set(campaign.id);
    this.notice.set('');
    this.api.post(`campaigns/${encodeURIComponent(campaign.id)}/${action}`, {}).subscribe({
      next: () => { this.notice.set(`Campaign ${action} request accepted.`); this.actionCampaignId.set(null); this.loadCampaigns(); },
      error: () => { this.notice.set(`Campaign ${action} is unavailable. Check your connection and permissions.`); this.actionCampaignId.set(null); },
    });
  }
}
