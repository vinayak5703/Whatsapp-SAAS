import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Building, CheckCircle2, Copy, KeyRound, Lock, LucideAngularModule,
  RefreshCw, Save, Send, ShieldCheck, Sparkles, Terminal, Webhook,
  Zap, AlertCircle, Code, Server, Play, FileCode, Check
} from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <!-- HEADER -->
      <div class="page-heading">
        <div>
          <p class="eyebrow">Platform Configuration</p>
          <h1>Workspace Settings & Engine Preferences</h1>
          <p class="page-subtitle">Configure workspace profile, broadcast throttle limits, ERP gateway integration, webhooks, and API security.</p>
        </div>
        <div class="heading-actions">
          <button class="button button-secondary" type="button" (click)="loadSettings()" [disabled]="loading()">
            <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="loading()" />
            {{ loading() ? 'Loading…' : 'Reload' }}
          </button>
        </div>
      </div>

      <!-- NOTIFICATION BANNER -->
      @if (toastMessage()) {
        <div class="toast-banner" [class.toast-error]="toastType() === 'error'">
          <lucide-angular [img]="toastType() === 'error' ? AlertCircle : CheckCircle2" [size]="18" />
          <span>{{ toastMessage() }}</span>
        </div>
      }

      <div class="settings-layout">
        <!-- SETTINGS TABS NAV -->
        <aside class="settings-nav surface">
          <button
            type="button"
            class="tab-item"
            [class.tab-active]="activeTab() === 'general'"
            (click)="setTab('general')"
          >
            <lucide-angular [img]="Building" [size]="18" />
            <div class="tab-text">
              <strong>Workspace Profile</strong>
              <small>Business info & timezone</small>
            </div>
          </button>

          <button
            type="button"
            class="tab-item"
            [class.tab-active]="activeTab() === 'erp'"
            (click)="setTab('erp')"
          >
            <lucide-angular [img]="Server" [size]="18" />
            <div class="tab-text">
              <strong>ERP & CRM Gateway</strong>
              <small>Tally, SAP, Billing API</small>
            </div>
            <span class="badge-new">NEW</span>
          </button>

          <button
            type="button"
            class="tab-item"
            [class.tab-active]="activeTab() === 'messaging'"
            (click)="setTab('messaging')"
          >
            <lucide-angular [img]="Zap" [size]="18" />
            <div class="tab-text">
              <strong>Broadcast & Anti-Ban</strong>
              <small>Throttle & safety rules</small>
            </div>
          </button>

          <button
            type="button"
            class="tab-item"
            [class.tab-active]="activeTab() === 'webhooks'"
            (click)="setTab('webhooks')"
          >
            <lucide-angular [img]="Webhook" [size]="18" />
            <div class="tab-text">
              <strong>Webhooks & API Keys</strong>
              <small>Developer integrations</small>
            </div>
          </button>

          <button
            type="button"
            class="tab-item"
            [class.tab-active]="activeTab() === 'security'"
            (click)="setTab('security')"
          >
            <lucide-angular [img]="Lock" [size]="18" />
            <div class="tab-text">
              <strong>Security & Password</strong>
              <small>Credentials & sessions</small>
            </div>
          </button>

          <button
            type="button"
            class="tab-item"
            [class.tab-active]="activeTab() === 'billing'"
            (click)="setTab('billing')"
          >
            <lucide-angular [img]="Sparkles" [size]="18" />
            <div class="tab-text">
              <strong>Plan & Quotas</strong>
              <small>Unlimited Pro Tier</small>
            </div>
          </button>
        </aside>

        <!-- MAIN TAB CONTENT AREA -->
        <main class="settings-content surface">
          <!-- 1. GENERAL / WORKSPACE PROFILE -->
          @if (activeTab() === 'general') {
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="panel-head">
                <h2>Workspace & Business Identity</h2>
                <p>Manage default workspace information, contact details, and locale defaults.</p>
              </div>

              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="field-label">Workspace / Organization Name</label>
                  <input type="text" class="control" formControlName="workspaceName" placeholder="e.g. MsgFlow Cloud Marketing" />
                </div>

                <div class="form-group">
                  <label class="field-label">Primary Contact Person</label>
                  <input type="text" class="control" formControlName="contactPerson" placeholder="e.g. Vinayak Bhoskar" />
                </div>

                <div class="form-group">
                  <label class="field-label">Support Email Address</label>
                  <input type="email" class="control" formControlName="contactEmail" placeholder="support@domain.com" />
                </div>

                <div class="form-group">
                  <label class="field-label">Support WhatsApp / Phone</label>
                  <input type="text" class="control" formControlName="contactPhone" placeholder="+91 7499415916" />
                </div>

                <div class="form-group">
                  <label class="field-label">Default Country Dialing Code</label>
                  <select class="control" formControlName="countryCode">
                    <option value="+91">+91 (India 🇮🇳)</option>
                    <option value="+1">+1 (United States / Canada 🇺🇸)</option>
                    <option value="+44">+44 (United Kingdom 🇬🇧)</option>
                    <option value="+971">+971 (UAE 🇦🇪)</option>
                    <option value="+61">+61 (Australia 🇦🇺)</option>
                    <option value="+65">+65 (Singapore 🇸🇬)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="field-label">Workspace Timezone</label>
                  <select class="control" formControlName="timezone">
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST - UTC+05:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York (EST)">America/New_York (EST / EDT)</option>
                    <option value="Europe/London (GMT)">Europe/London (GMT / BST)</option>
                    <option value="Asia/Dubai (GST)">Asia/Dubai (GST - UTC+04:00)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="field-label">System Default Language</label>
                  <select class="control" formControlName="language">
                    <option value="mr">Marathi (मराठी 🚩)</option>
                    <option value="en">English (Global 🌐)</option>
                    <option value="hi">Hindi (हिन्दी 🇮🇳)</option>
                  </select>
                </div>
              </div>

              <div class="form-foot">
                <button class="button button-primary" type="submit" [disabled]="saving()">
                  <lucide-angular [img]="Save" [size]="16" />
                  {{ saving() ? 'Saving Changes…' : 'Save Workspace Profile' }}
                </button>
              </div>
            </form>
          }

          <!-- 2. ERP & CRM GATEWAY (NEW) -->
          @if (activeTab() === 'erp') {
            <div>
              <div class="panel-head">
                <h2>ERP, CRM & Billing Software Inbound API Gateway</h2>
                <p>Allow your external ERP (Tally, SAP, Marg, Custom Billing / CRM) to automatically send WhatsApp messages through MsgFlow using REST API.</p>
              </div>

              <!-- ENDPOINT HIGHLIGHT BOX -->
              <div class="erp-endpoint-box">
                <div class="erp-endpoint-header">
                  <span class="http-badge post-badge">POST</span>
                  <code class="endpoint-url">http://localhost:3001/api/v1/erp/send</code>
                  <button type="button" class="button button-secondary compact-btn" (click)="copyToClipboard('http://localhost:3001/api/v1/erp/send', 'Endpoint URL')">
                    <lucide-angular [img]="Copy" [size]="13" /> Copy URL
                  </button>
                </div>
                <div class="erp-endpoint-auth">
                  <span><strong>Auth Header:</strong> <code>Authorization: Bearer {{ apiKey() }}</code></span>
                </div>
              </div>

              <!-- INTERACTIVE LIVE ERP TESTER -->
              <div class="erp-tester-card surface-muted">
                <div class="tester-title">
                  <lucide-angular [img]="Play" [size]="16" class="green-icon" />
                  <strong>Live ERP Call Simulator (Test Sending from ERP)</strong>
                </div>
                <p class="tester-sub">Simulate a call from your ERP software to test WhatsApp dispatch in real-time.</p>

                <form [formGroup]="erpTestForm" (ngSubmit)="testErpSend()" class="tester-form">
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="field-label">Customer Mobile Number (Recipient)</label>
                      <input type="text" class="control" formControlName="recipient" placeholder="e.g. 917499415916" />
                    </div>

                    <div class="form-group">
                      <label class="field-label">ERP Invoice / Order Ref ID (Optional)</label>
                      <input type="text" class="control" formControlName="referenceId" placeholder="e.g. INV-2026-8941" />
                    </div>

                    <div class="form-group span-2">
                      <label class="field-label">Message Payload</label>
                      <textarea
                        class="control"
                        rows="3"
                        formControlName="message"
                        [placeholder]="'Hello {{name}}, your Invoice #{{invoiceNo}} of Rs. {{amount}} is generated successfully!'"
                      ></textarea>
                    </div>
                  </div>

                  <div class="tester-actions">
                    <button class="button button-primary" type="submit" [disabled]="testingErp() || erpTestForm.invalid">
                      <lucide-angular [img]="Send" [size]="15" [class.spin]="testingErp()" />
                      {{ testingErp() ? 'Dispatching via ERP API…' : 'Trigger ERP API Call' }}
                    </button>
                  </div>
                </form>

                @if (erpTestResponse()) {
                  <div class="erp-response-box">
                    <strong>ERP API Response:</strong>
                    <pre><code>{{ erpTestResponse() | json }}</code></pre>
                  </div>
                }
              </div>

              <!-- READY-TO-USE CODE SNIPPETS -->
              <div class="code-samples-section">
                <div class="code-samples-header">
                  <div class="tab-code-buttons">
                    <button type="button" class="c-btn" [class.c-active]="codeLang() === 'curl'" (click)="codeLang.set('curl')">cURL</button>
                    <button type="button" class="c-btn" [class.c-active]="codeLang() === 'csharp'" (click)="codeLang.set('csharp')">C# / .NET (Tally & Desktop ERP)</button>
                    <button type="button" class="c-btn" [class.c-active]="codeLang() === 'php'" (click)="codeLang.set('php')">PHP / Laravel (Web ERP)</button>
                    <button type="button" class="c-btn" [class.c-active]="codeLang() === 'python'" (click)="codeLang.set('python')">Python</button>
                    <button type="button" class="c-btn" [class.c-active]="codeLang() === 'nodejs'" (click)="codeLang.set('nodejs')">Node.js</button>
                  </div>
                  <button type="button" class="button button-secondary compact-btn" (click)="copyCodeSnippet()">
                    <lucide-angular [img]="Copy" [size]="13" /> Copy Code
                  </button>
                </div>

                <div class="code-display">
                  <pre><code>{{ getCodeSnippet() }}</code></pre>
                </div>
              </div>
            </div>
          }

          <!-- 3. BROADCAST & ANTI-BAN PREFERENCES -->
          @if (activeTab() === 'messaging') {
            <form [formGroup]="messagingForm" (ngSubmit)="saveMessaging()">
              <div class="panel-head">
                <h2>Broadcast Engine & Anti-Ban Protection</h2>
                <p>Configure pacing, safety throttle intervals, automatic retry policies, and compliance opt-out tags.</p>
              </div>

              <div class="anti-ban-shield">
                <lucide-angular [img]="ShieldCheck" [size]="28" class="shield-icon" />
                <div>
                  <strong>Active Anti-Ban Algorithm Enabled</strong>
                  <p>MsgFlow intelligently randomizes inter-message delays and mimics human typing to keep your WhatsApp connection healthy and prevent spam flags.</p>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="field-label">Sending Throttle Mode</label>
                  <div class="speed-cards">
                    <label class="speed-card" [class.speed-selected]="messagingForm.get('speedMode')?.value === 'safe'">
                      <input type="radio" value="safe" formControlName="speedMode" class="hidden-input" />
                      <strong>Safe Mode (6-10s delay)</strong>
                      <small>Recommended for new phone numbers. Highest safety.</small>
                    </label>

                    <label class="speed-card" [class.speed-selected]="messagingForm.get('speedMode')?.value === 'balanced'">
                      <input type="radio" value="balanced" formControlName="speedMode" class="hidden-input" />
                      <strong>Balanced (3-5s delay)</strong>
                      <small>Optimal speed for verified active accounts.</small>
                    </label>

                    <label class="speed-card" [class.speed-selected]="messagingForm.get('speedMode')?.value === 'fast'">
                      <input type="radio" value="fast" formControlName="speedMode" class="hidden-input" />
                      <strong>Turbo Fast (1-2s delay)</strong>
                      <small>High throughput mode for bulk alerts.</small>
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label class="field-label">Custom Delay Between Messages (Seconds)</label>
                  <input type="number" class="control" formControlName="batchDelaySeconds" min="1" max="60" />
                </div>

                <div class="form-group">
                  <label class="field-label">Max Auto-Retries on Failure</label>
                  <input type="number" class="control" formControlName="maxRetries" min="0" max="5" />
                </div>

                <div class="form-group span-2">
                  <label class="toggle-control">
                    <input type="checkbox" formControlName="typingSimulation" />
                    <span class="toggle-label">
                      <strong>Simulate "Typing..." state before sending</strong>
                      <small>Shows active typing indicator to recipient before the message lands.</small>
                    </span>
                  </label>
                </div>

                <div class="form-group span-2">
                  <label class="toggle-control">
                    <input type="checkbox" formControlName="includeOptOut" />
                    <span class="toggle-label">
                      <strong>Append Opt-Out Tag (Compliance)</strong>
                      <small>Adds an unsubscription footer to broadcast messages.</small>
                    </span>
                  </label>
                </div>

                @if (messagingForm.get('includeOptOut')?.value) {
                  <div class="form-group span-2">
                    <label class="field-label">Opt-Out Footer Text</label>
                    <input type="text" class="control" formControlName="optOutText" placeholder="Reply STOP to unsubscribe." />
                  </div>
                }
              </div>

              <div class="form-foot">
                <button class="button button-primary" type="submit" [disabled]="saving()">
                  <lucide-angular [img]="Save" [size]="16" />
                  {{ saving() ? 'Saving Changes…' : 'Save Broadcast Rules' }}
                </button>
              </div>
            </form>
          }

          <!-- 4. WEBHOOKS & API KEYS -->
          @if (activeTab() === 'webhooks') {
            <div>
              <div class="panel-head">
                <h2>Webhooks & Developer API Access</h2>
                <p>Integrate MsgFlow with external CRMs, websites, or custom backend services via REST API and Webhook event dispatches.</p>
              </div>

              <div class="api-key-box surface-muted">
                <div class="api-key-header">
                  <div class="api-title">
                    <lucide-angular [img]="KeyRound" [size]="18" />
                    <strong>Live Production API Key</strong>
                  </div>
                  <button type="button" class="button button-secondary compact-btn" (click)="regenerateApiKey()" [disabled]="saving()">
                    <lucide-angular [img]="RefreshCw" [size]="13" /> Regenerate Key
                  </button>
                </div>

                <div class="key-field">
                  <input type="text" readonly class="control key-input" [value]="apiKey()" />
                  <button type="button" class="button button-primary compact-btn" (click)="copyToClipboard(apiKey(), 'API Key')">
                    <lucide-angular [img]="Copy" [size]="14" /> Copy
                  </button>
                </div>
                <small class="key-hint">Authenticate all requests by including <code>Authorization: Bearer &lt;API_KEY&gt;</code> header.</small>
              </div>

              <form [formGroup]="webhooksForm" (ngSubmit)="saveWebhooks()" class="webhook-form">
                <div class="form-group">
                  <label class="field-label">Incoming Webhook URL</label>
                  <input type="url" class="control" formControlName="webhookUrl" placeholder="https://api.yourdomain.com/webhooks/whatsapp" />
                </div>

                <div class="form-group">
                  <label class="field-label">Webhook Signing Secret</label>
                  <div class="key-field">
                    <input type="text" readonly class="control" [value]="webhookSecret()" />
                    <button type="button" class="button button-secondary compact-btn" (click)="copyToClipboard(webhookSecret(), 'Webhook Secret')">
                      <lucide-angular [img]="Copy" [size]="14" /> Copy
                    </button>
                  </div>
                </div>

                <div class="form-foot">
                  <button class="button button-primary" type="submit" [disabled]="saving()">
                    <lucide-angular [img]="Save" [size]="16" />
                    {{ saving() ? 'Saving…' : 'Save Webhook Configuration' }}
                  </button>
                </div>
              </form>
            </div>
          }

          <!-- 5. SECURITY & PASSWORD -->
          @if (activeTab() === 'security') {
            <form [formGroup]="securityForm" (ngSubmit)="savePassword()">
              <div class="panel-head">
                <h2>Account Security & Credentials</h2>
                <p>Change login password and manage active authentication tokens.</p>
              </div>

              <div class="form-grid">
                <div class="form-group span-2">
                  <label class="field-label">Current Account Email</label>
                  <input type="email" class="control" [value]="auth.currentUser()?.email || 'admin@msgflow.local'" disabled />
                </div>

                <div class="form-group">
                  <label class="field-label">New Password</label>
                  <input type="password" class="control" formControlName="newPassword" placeholder="Minimum 6 characters" />
                </div>

                <div class="form-group">
                  <label class="field-label">Confirm New Password</label>
                  <input type="password" class="control" formControlName="confirmPassword" placeholder="Re-type password" />
                </div>
              </div>

              <div class="form-foot">
                <button class="button button-primary" type="submit" [disabled]="saving() || securityForm.invalid">
                  <lucide-angular [img]="Lock" [size]="16" />
                  {{ saving() ? 'Updating…' : 'Update Password' }}
                </button>
              </div>
            </form>
          }

          <!-- 6. PLAN & QUOTAS -->
          @if (activeTab() === 'billing') {
            <div>
              <div class="panel-head">
                <h2>Subscription & License Overview</h2>
                <p>Review your active workspace license, message limits, and WhatsApp channel entitlements.</p>
              </div>

              <div class="plan-card">
                <div class="plan-top">
                  <div>
                    <span class="plan-badge">ACTIVE LICENSE</span>
                    <h3 class="plan-title">MsgFlow Multi-Contact Automation (Pro Edition)</h3>
                    <p class="plan-sub">High-capacity automated broadcasts, template variables, media support & full API access.</p>
                  </div>
                  <div class="plan-price">
                    <strong>Lifetime</strong>
                    <small>All Features Unlocked</small>
                  </div>
                </div>

                <div class="plan-features-grid">
                  <div class="feat-item">
                    <lucide-angular [img]="CheckCircle2" [size]="16" class="f-icon" />
                    <span><strong>Unlimited</strong> Outbound Broadcast Messages</span>
                  </div>
                  <div class="feat-item">
                    <lucide-angular [img]="CheckCircle2" [size]="16" class="f-icon" />
                    <span><strong>4 Media Formats</strong>: Audio, Video, Photo, PDF</span>
                  </div>
                  <div class="feat-item">
                    <lucide-angular [img]="CheckCircle2" [size]="16" class="f-icon" />
                    <span><strong>Smart Anti-Ban</strong> Protection Engine</span>
                  </div>
                  <div class="feat-item">
                    <lucide-angular [img]="CheckCircle2" [size]="16" class="f-icon" />
                    <span><strong>Full REST API</strong> & Webhook Integration</span>
                  </div>
                  <div class="feat-item">
                    <lucide-angular [img]="CheckCircle2" [size]="16" class="f-icon" />
                    <span><strong>Dedicated Support</strong> by Vinayak Bhoskar (+91 7499415916)</span>
                  </div>
                  <div class="feat-item">
                    <lucide-angular [img]="CheckCircle2" [size]="16" class="f-icon" />
                    <span><strong>Persistent Analytics</strong> & 7-Day History Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </section>
  `,
  styles: [`
    .settings-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 20px;
      align-items: start;
    }

    .toast-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 10px;
      margin-bottom: 18px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--green);
      color: var(--green);
      font-size: 13px;
      font-weight: 700;
      animation: fadeIn 0.3s ease;
    }
    .toast-banner.toast-error {
      background: rgba(244, 63, 94, 0.15);
      border-color: var(--coral);
      color: var(--coral);
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px;
      border-radius: 12px;
    }
    .tab-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--ink-soft);
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      position: relative;
    }
    .tab-item:hover {
      background: var(--surface-muted);
      color: var(--ink);
    }
    .tab-item.tab-active {
      background: var(--green-wash);
      border-color: rgba(16, 185, 129, 0.35);
      color: var(--green);
    }
    .tab-text { display: flex; flex-direction: column; }
    .tab-text strong { font-size: 13px; font-weight: 700; }
    .tab-text small { font-size: 10px; color: var(--ink-faint); margin-top: 1px; }

    .badge-new {
      position: absolute;
      right: 10px;
      top: 10px;
      background: #0284c7;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 4px;
    }

    .settings-content {
      padding: 24px;
      border-radius: 12px;
      min-height: 480px;
    }
    .panel-head { margin-bottom: 22px; }
    .panel-head h2 { font-size: 17px; font-weight: 800; color: var(--ink); margin: 0 0 4px; }
    .panel-head p { font-size: 12px; color: var(--ink-soft); margin: 0; }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .span-2 { grid-column: span 2; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-soft); }

    .form-foot {
      display: flex;
      justify-content: flex-end;
      padding-top: 18px;
      border-top: 1px solid var(--line);
    }

    /* ERP Endpoint Box */
    .erp-endpoint-box {
      padding: 16px;
      border-radius: 10px;
      border: 1px solid rgba(16, 185, 129, 0.4);
      background: var(--green-wash);
      margin-bottom: 20px;
    }
    .erp-endpoint-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }
    .http-badge {
      font-size: 11px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 5px;
    }
    .post-badge { background: #10b981; color: #fff; }
    .endpoint-url { font-family: monospace; font-size: 13px; font-weight: 700; color: var(--ink); }
    .erp-endpoint-auth { font-size: 11px; color: var(--ink-soft); }
    .erp-endpoint-auth code { background: var(--surface); padding: 3px 6px; border-radius: 4px; border: 1px solid var(--line); font-family: monospace; }

    /* ERP Tester Card */
    .erp-tester-card {
      padding: 18px;
      border-radius: 12px;
      border: 1px solid var(--line);
      margin-bottom: 24px;
    }
    .tester-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
    .green-icon { color: var(--green); }
    .tester-sub { font-size: 11px; color: var(--ink-soft); margin: 0 0 16px; }
    .tester-actions { display: flex; justify-content: flex-end; margin-top: 12px; }

    .erp-response-box {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .erp-response-box strong { font-size: 11px; color: var(--green); display: block; margin-bottom: 6px; }
    .erp-response-box pre { margin: 0; font-family: monospace; font-size: 11px; color: var(--ink); overflow-x: auto; }

    /* Code Samples */
    .code-samples-section {
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
    }
    .code-samples-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--surface-muted);
      border-bottom: 1px solid var(--line);
      flex-wrap: wrap;
      gap: 8px;
    }
    .tab-code-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
    .c-btn {
      background: transparent;
      border: 1px solid var(--line);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      color: var(--ink-soft);
      cursor: pointer;
    }
    .c-btn:hover { background: var(--line); color: var(--ink); }
    .c-btn.c-active { background: var(--green); color: #fff; border-color: var(--green); }

    .code-display { padding: 16px; background: #0f172a; overflow-x: auto; }
    .code-display pre { margin: 0; }
    .code-display code { font-family: Consolas, Monaco, monospace; font-size: 12px; color: #38bdf8; line-height: 1.5; }

    /* Anti Ban Card */
    .anti-ban-shield {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 10px;
      background: var(--green-wash);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--green);
      margin-bottom: 20px;
    }
    .anti-ban-shield strong { font-size: 13px; font-weight: 800; display: block; margin-bottom: 2px; }
    .anti-ban-shield p { font-size: 11px; color: var(--ink-soft); margin: 0; line-height: 1.5; }
    .shield-icon { flex-shrink: 0; }

    /* Speed Cards */
    .speed-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .speed-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--surface-muted);
      cursor: pointer;
      transition: all 0.2s;
    }
    .speed-card:hover { border-color: rgba(16, 185, 129, 0.4); }
    .speed-card.speed-selected {
      border-color: var(--green);
      background: var(--green-wash);
    }
    .speed-card strong { font-size: 12px; font-weight: 800; color: var(--ink); }
    .speed-card small { font-size: 10px; color: var(--ink-soft); }

    /* Toggle Control */
    .toggle-control {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      padding: 10px 0;
    }
    .toggle-control input[type="checkbox"] { width: 16px; height: 16px; margin-top: 2px; accent-color: var(--green); }
    .toggle-label strong { font-size: 12px; font-weight: 700; color: var(--ink); display: block; }
    .toggle-label small { font-size: 10px; color: var(--ink-soft); }

    /* API Key Box */
    .api-key-box {
      padding: 18px;
      border-radius: 10px;
      border: 1px solid var(--line);
      margin-bottom: 20px;
    }
    .api-key-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .api-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; color: var(--ink); }
    .compact-btn { height: 32px; font-size: 11px; padding: 0 10px; }
    .key-field { display: flex; gap: 8px; margin-bottom: 8px; }
    .key-input { font-family: monospace; font-size: 12px; }
    .key-hint { font-size: 10px; color: var(--ink-soft); }
    .key-hint code { background: var(--line); padding: 2px 5px; border-radius: 4px; }

    .webhook-form { margin-top: 16px; display: flex; flex-direction: column; gap: 16px; }

    /* Plan Card */
    .plan-card {
      padding: 24px;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.4);
      background: linear-gradient(180deg, var(--surface) 0%, rgba(16, 185, 129, 0.06) 100%);
    }
    .plan-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid var(--line); padding-bottom: 16px; }
    .plan-badge { background: var(--green-wash); color: var(--green); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
    .plan-title { font-size: 18px; font-weight: 800; color: var(--ink); margin: 0 0 4px; }
    .plan-sub { font-size: 12px; color: var(--ink-soft); margin: 0; }
    .plan-price { text-align: right; }
    .plan-price strong { font-size: 22px; font-weight: 900; color: var(--green); display: block; }
    .plan-price small { font-size: 10px; color: var(--ink-faint); }

    .plan-features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
    .feat-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--ink); }
    .f-icon { color: var(--green); flex-shrink: 0; }

    .hidden-input { display: none; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
      .form-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .speed-cards { grid-template-columns: 1fr; }
      .plan-features-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class SettingsShellComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<'general' | 'erp' | 'messaging' | 'webhooks' | 'security' | 'billing'>('general');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly testingErp = signal(false);
  readonly erpTestResponse = signal<any>(null);
  readonly codeLang = signal<'curl' | 'csharp' | 'php' | 'python' | 'nodejs'>('curl');

  readonly toastMessage = signal('');
  readonly toastType = signal<'success' | 'error'>('success');

  readonly apiKey = signal('msgflow_live_948fbc091e847aa1');
  readonly webhookSecret = signal('whsec_88f92cb71a40');

  // Icons
  readonly Building = Building;
  readonly Server = Server;
  readonly Zap = Zap;
  readonly Webhook = Webhook;
  readonly Lock = Lock;
  readonly Sparkles = Sparkles;
  readonly RefreshCw = RefreshCw;
  readonly Save = Save;
  readonly Copy = Copy;
  readonly KeyRound = KeyRound;
  readonly ShieldCheck = ShieldCheck;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly Play = Play;
  readonly Send = Send;

  readonly profileForm: FormGroup = this.fb.group({
    workspaceName: ['MsgFlow Cloud Automation', Validators.required],
    contactPerson: ['Vinayak Bhoskar', Validators.required],
    contactEmail: ['vinayakbhoskar@gmail.com', [Validators.required, Validators.email]],
    contactPhone: ['+917499415916', Validators.required],
    countryCode: ['+91'],
    timezone: ['Asia/Kolkata (IST)'],
    language: ['mr'],
  });

  readonly erpTestForm: FormGroup = this.fb.group({
    recipient: ['917499415916', Validators.required],
    referenceId: ['INV-2026-4091'],
    message: ['Hello! Your order/invoice #INV-2026-4091 of Rs. 4,500 has been created successfully. Thank you for your business! - MsgFlow ERP', Validators.required],
  });

  readonly messagingForm: FormGroup = this.fb.group({
    speedMode: ['balanced'],
    batchDelaySeconds: [4, [Validators.required, Validators.min(1)]],
    antiBanProtection: [true],
    autoRetryFailed: [true],
    maxRetries: [3, [Validators.required, Validators.min(0)]],
    typingSimulation: [true],
    includeOptOut: [false],
    optOutText: ['Reply STOP to unsubscribe.'],
  });

  readonly webhooksForm: FormGroup = this.fb.group({
    webhookUrl: ['https://api.yourdomain.com/webhooks/whatsapp'],
  });

  readonly securityForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const section = params['section'];
      if (section && ['general', 'erp', 'messaging', 'webhooks', 'security', 'billing'].includes(section)) {
        this.activeTab.set(section as any);
      }
    });

    this.loadSettings();
  }

  setTab(tab: 'general' | 'erp' | 'messaging' | 'webhooks' | 'security' | 'billing'): void {
    this.activeTab.set(tab);
    this.toastMessage.set('');
  }

  loadSettings(): void {
    this.loading.set(true);
    this.api.get<any>('settings').subscribe({
      next: (res) => {
        if (res?.profile) this.profileForm.patchValue(res.profile);
        if (res?.messaging) this.messagingForm.patchValue(res.messaging);
        if (res?.webhooks) {
          this.webhooksForm.patchValue({ webhookUrl: res.webhooks.webhookUrl });
          if (res.webhooks.apiKey) this.apiKey.set(res.webhooks.apiKey);
          if (res.webhooks.webhookSecret) this.webhookSecret.set(res.webhooks.webhookSecret);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  testErpSend(): void {
    if (this.erpTestForm.invalid) return;
    this.testingErp.set(true);
    this.erpTestResponse.set(null);

    const payload = {
      to: this.erpTestForm.value.recipient,
      message: this.erpTestForm.value.message,
      referenceId: this.erpTestForm.value.referenceId,
      apiKey: this.apiKey(),
    };

    this.api.post<any>('erp/send', payload).subscribe({
      next: (res) => {
        this.testingErp.set(false);
        this.erpTestResponse.set(res);
        this.showToast('ERP WhatsApp message dispatched successfully!');
      },
      error: (err) => {
        this.testingErp.set(false);
        this.erpTestResponse.set({ error: err?.error?.message || 'Could not send message from ERP' });
        this.showToast('ERP API call returned an error.', 'error');
      },
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.saving.set(true);
    this.api.put<any>('settings/profile', this.profileForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.showToast('Workspace profile settings saved successfully!');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Failed to save profile settings.', 'error');
      },
    });
  }

  saveMessaging(): void {
    if (this.messagingForm.invalid) return;
    this.saving.set(true);
    this.api.put<any>('settings/messaging', this.messagingForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.showToast('Broadcast & Anti-Ban rules saved successfully!');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Failed to save messaging rules.', 'error');
      },
    });
  }

  saveWebhooks(): void {
    this.saving.set(true);
    this.api.put<any>('settings/webhooks', this.webhooksForm.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.showToast('Webhook endpoint settings updated!');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Failed to update webhooks.', 'error');
      },
    });
  }

  regenerateApiKey(): void {
    this.saving.set(true);
    this.api.post<any>('settings/api-key/regenerate', {}).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res?.apiKey) this.apiKey.set(res.apiKey);
        this.showToast('New production API Key generated!');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Could not regenerate API key.', 'error');
      },
    });
  }

  savePassword(): void {
    if (this.securityForm.invalid) return;
    const { newPassword, confirmPassword } = this.securityForm.value;
    if (newPassword !== confirmPassword) {
      this.showToast('Passwords do not match.', 'error');
      return;
    }
    this.saving.set(true);
    this.api.put<any>('settings/security/password', { newPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.securityForm.reset();
        this.showToast('Password updated successfully!');
      },
      error: () => {
        this.saving.set(false);
        this.showToast('Failed to update password.', 'error');
      },
    });
  }

  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text);
    this.showToast(`${label} copied to clipboard!`);
  }

  copyCodeSnippet(): void {
    this.copyToClipboard(this.getCodeSnippet(), 'Code snippet');
  }

  getCodeSnippet(): string {
    const key = this.apiKey();
    switch (this.codeLang()) {
      case 'curl':
        return `curl -X POST http://localhost:3001/api/v1/erp/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${key}" \\
  -d '{
    "to": "917499415916",
    "message": "Hello Rahul, your Invoice #INV-1024 for Rs. 4,500 is ready.",
    "referenceId": "INV-1024"
  }'`;

      case 'csharp':
        return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

// C# / .NET Example for Tally, SAP, or Windows Billing Software
public class ErpWhatsAppSender
{
    private static readonly HttpClient client = new HttpClient();

    public static async Task SendInvoiceAlert(string customerPhone, string invoiceNo, decimal amount)
    {
        var url = "http://localhost:3001/api/v1/erp/send";
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer ${key}");

        var json = $"{{\\"to\\":\\"{customerPhone}\\",\\"message\\":\\"Hello, your Invoice #{invoiceNo} of Rs. {amount} is ready.\\",\\"referenceId\\":\\"{invoiceNo}\\"}}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(url, content);
        var result = await response.Content.ReadAsStringAsync();
        Console.WriteLine("MsgFlow ERP Response: " + result);
    }
}`;

      case 'php':
        return `<?php
// PHP / Laravel Web ERP Example
$url = 'http://localhost:3001/api/v1/erp/send';
$apiKey = '${key}';

$data = [
    'to' => '917499415916',
    'message' => 'Hello Vinayak, your ERP order has been confirmed successfully!',
    'referenceId' => 'ORD-9842'
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`;

      case 'python':
        return `import requests

# Python ERP / Django / FastAPI integration
url = "http://localhost:3001/api/v1/erp/send"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${key}"
}
payload = {
    "to": "917499415916",
    "message": "Dear Customer, payment reminder for Invoice #INV-5501. Thank you.",
    "referenceId": "INV-5501"
}

response = requests.post(url, json=payload, headers=headers)
print("ERP Status:", response.status_code)
print("Response:", response.json())`;

      case 'nodejs':
        return `const axios = require('axios');

async function sendFromErp() {
  const url = 'http://localhost:3001/api/v1/erp/send';
  const response = await axios.post(url, {
    to: '917499415916',
    message: 'Hello, your shipment has been dispatched. Tracking: TRK9942',
    referenceId: 'SHP-9942'
  }, {
    headers: {
      'Authorization': 'Bearer ${key}',
      'Content-Type': 'application/json'
    }
  });

  console.log('MsgFlow Response:', response.data);
}

sendFromErp();`;
    }
  }

  private showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => this.toastMessage.set(''), 4000);
  }
}
