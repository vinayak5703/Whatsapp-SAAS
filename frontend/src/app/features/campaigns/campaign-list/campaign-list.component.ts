import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  CheckCircle2, CircleAlert, LucideAngularModule, Megaphone,
  Pause, Play, Plus, RefreshCw, Send, Trash2, UsersRound, Zap
} from 'lucide-angular';
import { Campaign, PageResult } from '../../../core/models/api.models';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Outreach & Automation</p>
          <h1>Broadcast Campaigns</h1>
          <p class="page-subtitle">Create, monitor, and manage automated WhatsApp campaigns for all your contacts and groups.</p>
        </div>
        <div class="heading-actions">
          <button class="button button-secondary" type="button" (click)="loadCampaigns()" [disabled]="loading()">
            <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="loading()" />
            {{ loading() ? 'Updating…' : 'Refresh' }}
          </button>
          <a class="button button-primary" routerLink="/campaigns/new">
            <lucide-angular [img]="Plus" [size]="15" />Create Campaign
          </a>
        </div>
      </div>

      @if (notice()) {
        <div class="notice-banner">
          <lucide-angular [img]="CheckCircle2" [size]="16" />
          <span>{{ notice() }}</span>
        </div>
      }

      <section class="campaign-panel surface">
        <div class="panel-top">
          <div class="top-meta">
            <strong>{{ campaigns().length }} Campaigns Active</strong>
            <span>Asynchronous background dispatch & analytics</span>
          </div>
          <div class="top-search">
            <input
              type="text"
              class="control search-input"
              placeholder="Search campaigns..."
              (input)="onSearch($event)"
            />
          </div>
        </div>

        @if (error()) {
          <div class="list-state error-state">
            <lucide-angular [img]="CircleAlert" [size]="24" />
            <strong>Campaigns could not be loaded</strong>
            <span>{{ error() }}</span>
          </div>
        } @else if (loading()) {
          <div class="list-state">
            <div class="spinner"></div>
            <span>Loading campaigns…</span>
          </div>
        } @else if (!campaigns().length) {
          <div class="list-state">
            <span class="empty-icon"><lucide-angular [img]="Megaphone" [size]="24" /></span>
            <strong>No campaigns created yet</strong>
            <span>Launch your first multi-recipient automated WhatsApp campaign with personalized messages & media attachments.</span>
            <a class="button button-primary" routerLink="/campaigns/new">
              <lucide-angular [img]="Plus" [size]="15" />Create Campaign
            </a>
          </div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Delivered</th>
                  <th>Failed</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (campaign of campaigns(); track campaign.id) {
                  <tr>
                    <td>
                      <div class="campaign-title-cell">
                        <span class="campaign-icon">
                          <lucide-angular [img]="Megaphone" [size]="15" />
                        </span>
                        <div>
                          <strong>{{ campaign.name }}</strong>
                          <small class="msg-snippet">{{ campaign.message || 'No description' }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="status" [class]="'status-' + campaign.status">
                        @if (campaign.status === 'running') {
                          <span class="live-pulse"></span>
                        }
                        {{ campaign.status }}
                      </span>
                    </td>
                    <td>
                      <div class="progress-cell">
                        <div class="progress-bar-bg">
                          <div
                            class="progress-bar-fill"
                            [style.width.%]="getProgress(campaign)"
                          ></div>
                        </div>
                        <small>{{ campaign.sentCount }} / {{ campaign.recipientCount }} recipients ({{ getProgress(campaign) }}%)</small>
                      </div>
                    </td>
                    <td><strong class="sent-num">{{ campaign.sentCount }}</strong></td>
                    <td><span [class.failed-num]="campaign.failedCount > 0">{{ campaign.failedCount }}</span></td>
                    <td class="muted-cell">{{ campaign.createdAt | date:'medium' }}</td>
                    <td>
                      <div class="action-buttons">
                        @if (campaign.status === 'draft' || campaign.status === 'failed' || campaign.status === 'paused') {
                          <button
                            class="button-action start-btn"
                            type="button"
                            title="Start Campaign"
                            [disabled]="actionCampaignId() === campaign.id"
                            (click)="changeStatus(campaign, 'start')"
                          >
                            <lucide-angular [img]="Play" [size]="14" />
                            <span>{{ campaign.status === 'paused' ? 'Resume' : 'Start' }}</span>
                          </button>
                        } @else if (campaign.status === 'running') {
                          <button
                            class="button-action pause-btn"
                            type="button"
                            title="Pause Campaign"
                            [disabled]="actionCampaignId() === campaign.id"
                            (click)="changeStatus(campaign, 'pause')"
                          >
                            <lucide-angular [img]="Pause" [size]="14" />
                            <span>Pause</span>
                          </button>
                        }

                        <button
                          class="button-action delete-btn"
                          type="button"
                          title="Delete Campaign"
                          [disabled]="actionCampaignId() === campaign.id"
                          (click)="deleteCampaign(campaign)"
                        >
                          <lucide-angular [img]="Trash2" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="list-footer">
            <span>Showing {{ campaigns().length }} campaigns</span>
          </div>
        }
      </section>
    </section>
  `,
  styles: [`
    .heading-actions { display: flex; gap: 10px; align-items: center; }
    .notice-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--green-wash);
      border: 1px solid rgba(37, 211, 102, 0.3);
      color: var(--green);
      font-size: 13px;
      font-weight: 700;
    }

    .campaign-panel { overflow: hidden; }
    .panel-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--line);
    }
    .top-meta strong { display: block; font-size: 14px; font-weight: 800; color: var(--ink); }
    .top-meta span { font-size: 11px; color: var(--ink-faint); }
    .search-input { width: 240px; height: 36px; font-size: 12px; }

    .campaign-title-cell { display: flex; align-items: center; gap: 12px; }
    .campaign-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: var(--green-wash);
      color: var(--green);
      flex-shrink: 0;
    }
    .msg-snippet {
      display: block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 11px;
      color: var(--ink-faint);
    }

    .progress-cell { width: 180px; }
    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: var(--surface-muted);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 4px;
      border: 1px solid var(--line);
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #25d366 0%, #10b981 100%);
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .progress-cell small { font-size: 10px; color: var(--ink-faint); }

    .sent-num { color: var(--green); font-size: 13px; }
    .failed-num { color: var(--coral); font-weight: 700; }
    .muted-cell { color: var(--ink-faint); font-size: 11px; }

    .live-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 1.5s infinite;
      display: inline-block;
      margin-right: 4px;
    }
    @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

    .action-buttons { display: flex; align-items: center; gap: 8px; }
    .button-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .button-action:hover { background: var(--surface-muted); }
    .start-btn { color: var(--green); border-color: rgba(37, 211, 102, 0.3); }
    .start-btn:hover { background: var(--green-wash); }
    .pause-btn { color: var(--amber); border-color: rgba(251, 191, 36, 0.3); }
    .pause-btn:hover { background: var(--amber-wash); }
    .delete-btn { color: var(--coral); padding: 5px 8px; }
    .delete-btn:hover { background: var(--coral-wash); border-color: var(--coral); }

    .list-state {
      display: grid;
      min-height: 260px;
      place-content: center;
      justify-items: center;
      gap: 10px;
      padding: 30px;
      color: var(--ink-soft);
      font-size: 12px;
      text-align: center;
    }
    .list-state strong { font-size: 16px; color: var(--ink); }
    .list-state span { max-width: 420px; line-height: 1.6; }
    .empty-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--green-wash);
      color: var(--green);
      display: grid;
      place-items: center;
    }
    .error-state { color: var(--coral); }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(37, 211, 102, 0.2);
      border-top-color: var(--green);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .list-footer {
      border-top: 1px solid var(--line);
      padding: 12px 20px;
      color: var(--ink-faint);
      font-size: 11px;
    }
  `],
})
export class CampaignListComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly campaigns = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly actionCampaignId = signal<string | null>(null);

  readonly Plus = Plus;
  readonly RefreshCw = RefreshCw;
  readonly CircleAlert = CircleAlert;
  readonly Megaphone = Megaphone;
  readonly CheckCircle2 = CheckCircle2;
  readonly Play = Play;
  readonly Pause = Pause;
  readonly Trash2 = Trash2;

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(search?: string): void {
    this.loading.set(true);
    this.error.set('');
    const params: Record<string, string | number> = { limit: 50 };
    if (search) params['search'] = search;

    this.api.get<{ items: any[]; total: number }>('campaigns', params).subscribe({
      next: (res) => {
        this.campaigns.set(res.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.campaigns.set([]);
        this.error.set('Could not fetch campaigns from server.');
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.trim();
    this.loadCampaigns(term);
  }

  getProgress(campaign: any): number {
    if (!campaign.recipientCount || campaign.recipientCount === 0) return 0;
    return Math.min(100, Math.round((campaign.sentCount / campaign.recipientCount) * 100));
  }

  changeStatus(campaign: any, action: 'start' | 'pause' | 'resume'): void {
    this.actionCampaignId.set(campaign.id);
    this.notice.set('');

    this.api.post(`campaigns/${encodeURIComponent(campaign.id)}/${action}`, {}).subscribe({
      next: () => {
        this.notice.set(`Campaign "${campaign.name}" ${action}ed successfully.`);
        this.actionCampaignId.set(null);
        this.loadCampaigns();
      },
      error: () => {
        this.notice.set(`Failed to ${action} campaign.`);
        this.actionCampaignId.set(null);
      },
    });
  }

  deleteCampaign(campaign: any): void {
    if (!confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) return;
    this.actionCampaignId.set(campaign.id);
    this.api.delete(`campaigns/${encodeURIComponent(campaign.id)}`).subscribe({
      next: () => {
        this.notice.set(`Campaign "${campaign.name}" deleted.`);
        this.actionCampaignId.set(null);
        this.loadCampaigns();
      },
      error: () => {
        this.notice.set('Failed to delete campaign.');
        this.actionCampaignId.set(null);
      },
    });
  }
}
