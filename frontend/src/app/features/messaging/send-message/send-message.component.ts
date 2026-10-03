import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  CheckCircle2,
  CircleAlert,
  File,
  FileImage,
  FileText,
  Film,
  Layers,
  LucideAngularModule,
  MessageSquareText,
  Music,
  Paperclip,
  Phone,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Users,
  UsersRound,
  X,
  XCircle,
} from 'lucide-angular';
import { Contact, Group, PageResult } from '../../../core/models/api.models';
import { ApiService } from '../../../core/services/api.service';

interface AttachedMedia {
  base64: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  mimetype: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  details: Array<{
    target: string;
    name?: string;
    type: string;
    success: boolean;
    error?: string;
  }>;
}

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Broadcast Messaging</p>
          <h1>Send WhatsApp Message & Media</h1>
          <p class="page-subtitle">Select multiple groups, contacts, or phone numbers and attach Photos, PDFs, Songs, or Videos.</p>
        </div>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="mode-tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="targetMode() === 'multi'"
          (click)="targetMode.set('multi')"
        >
          <lucide-angular [img]="Users" [size]="16" />
          Multi-Select (Groups & Contacts)
          @if (totalSelectedCount() > 0) {
            <span class="tab-badge">{{ totalSelectedCount() }}</span>
          }
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="targetMode() === 'manual'"
          (click)="targetMode.set('manual')"
        >
          <lucide-angular [img]="Layers" [size]="16" />
          Manual Numbers List
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="targetMode() === 'single'"
          (click)="targetMode.set('single')"
        >
          <lucide-angular [img]="Phone" [size]="16" />
          Single Recipient
        </button>
      </div>

      <div class="composer-layout">
        <form class="composer surface" [formGroup]="messageForm" (ngSubmit)="sendMessage()">
          
          <!-- MULTI-SELECT MODE (CONTACTS & GROUPS) -->
          @if (targetMode() === 'multi') {
            <div class="multi-select-container">
              <!-- SELECTION MASTER ACTIONS BAR -->
              <div class="selection-actions-bar">
                <span class="selection-summary-badge">
                  Selected: <strong>{{ selectedGroups().size }}</strong> Groups &bull; <strong>{{ selectedContacts().size }}</strong> Contacts (Total: {{ totalSelectedCount() }})
                </span>
                <div class="quick-select-btns">
                  <button type="button" class="btn-sm-action" (click)="toggleAllGroups()">
                    {{ allGroupsSelected() ? 'Deselect Groups' : 'Select All Groups (' + groups().length + ')' }}
                  </button>
                  <button type="button" class="btn-sm-action" (click)="toggleAllContacts()">
                    {{ allContactsSelected() ? 'Deselect Contacts' : 'Select All Contacts (' + contacts().length + ')' }}
                  </button>
                  @if (totalSelectedCount() > 0) {
                    <button type="button" class="btn-sm-clear" (click)="clearAllSelections()">
                      <lucide-angular [img]="X" [size]="13" /> Clear All
                    </button>
                  }
                </div>
              </div>

              <!-- GROUPS SECTION -->
              <div class="selector-section">
                <div class="selector-header">
                  <div class="title-with-count">
                    <lucide-angular [img]="UsersRound" [size]="16" />
                    <strong>WhatsApp Groups ({{ groups().length }})</strong>
                    @if (selectedGroups().size > 0) {
                      <span class="selected-badge">{{ selectedGroups().size }} selected</span>
                    }
                  </div>
                  <div class="selector-actions">
                    <button type="button" class="action-link" (click)="toggleAllGroups()">
                      {{ allGroupsSelected() ? 'Deselect All' : 'Select All Groups' }}
                    </button>
                  </div>
                </div>

                <div class="search-mini">
                  <input
                    type="text"
                    [ngModel]="groupSearch()"
                    (ngModelChange)="groupSearch.set($event)"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="Search groups by name..."
                  />
                </div>

                <div class="pills-grid">
                  @if (loadingData()) {
                    <p class="loading-hint">Loading WhatsApp groups…</p>
                  } @else if (filteredGroups().length === 0) {
                    <p class="empty-hint">No WhatsApp groups found. Sync groups from the WhatsApp channel first.</p>
                  } @else {
                    @for (group of filteredGroups(); track group.providerGroupId) {
                      <button
                        type="button"
                        class="pill-card"
                        [class.selected]="isGroupSelected(group.providerGroupId)"
                        (click)="toggleGroup(group.providerGroupId)"
                      >
                        <span class="pill-check">{{ isGroupSelected(group.providerGroupId) ? '✓' : '+' }}</span>
                        <span class="pill-title">{{ group.name }}</span>
                        <span class="pill-meta">{{ group.participantCount }} members</span>
                      </button>
                    }
                  }
                </div>
              </div>

              <!-- CONTACTS SECTION -->
              <div class="selector-section">
                <div class="selector-header">
                  <div class="title-with-count">
                    <lucide-angular [img]="Users" [size]="16" />
                    <strong>WhatsApp Contacts ({{ contacts().length }})</strong>
                    @if (selectedContacts().size > 0) {
                      <span class="selected-badge">{{ selectedContacts().size }} selected</span>
                    }
                  </div>
                  <div class="selector-actions">
                    <button type="button" class="action-link" (click)="toggleAllContacts()">
                      {{ allContactsSelected() ? 'Deselect All' : 'Select All Contacts' }}
                    </button>
                  </div>
                </div>

                <div class="search-mini">
                  <input
                    type="text"
                    [ngModel]="contactSearch()"
                    (ngModelChange)="contactSearch.set($event)"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="Search contacts by name or phone..."
                  />
                </div>

                <div class="pills-grid">
                  @if (loadingData()) {
                    <p class="loading-hint">Loading contacts…</p>
                  } @else if (filteredContacts().length === 0) {
                    <p class="empty-hint">No contacts found. Sync from WhatsApp channel first.</p>
                  } @else {
                    @for (contact of filteredContacts(); track contact.phoneE164) {
                      <button
                        type="button"
                        class="pill-card"
                        [class.selected]="isContactSelected(contact.phoneE164)"
                        (click)="toggleContact(contact.phoneE164)"
                      >
                        <span class="pill-check">{{ isContactSelected(contact.phoneE164) ? '✓' : '+' }}</span>
                        <span class="pill-title">{{ contact.displayName || contact.phoneE164 }}</span>
                        <span class="pill-meta">{{ contact.phoneE164 }}</span>
                      </button>
                    }
                  }
                </div>
              </div>
            </div>
          }

          <!-- MANUAL NUMBERS MODE -->
          @if (targetMode() === 'manual') {
            <label class="field">
              <span>Paste Phone Numbers (One per line or separated by comma)</span>
              <textarea
                class="control manual-textarea"
                [ngModel]="manualNumbersText()"
                (ngModelChange)="manualNumbersText.set($event)"
                [ngModelOptions]="{ standalone: true }"
                placeholder="+919876543210&#10;+919822334455&#10;+14155550123"
              ></textarea>
              <small>Include country code without spaces (e.g. +919876543210 or 919876543210).</small>
            </label>
          }

          <!-- SINGLE RECIPIENT MODE -->
          @if (targetMode() === 'single') {
            <label class="field">
              <span>Recipient Phone Number or Group ID</span>
              <input
                class="control"
                formControlName="recipient"
                inputmode="tel"
                placeholder="+919876543210 or 12036304892349@g.us"
              />
              <small>Enter individual phone number with country code, or a WhatsApp group JID.</small>
            </label>
          }

          <!-- ATTACH MEDIA (4 SEPARATE DEDICATED OPTIONS: IMAGE, PDF, SONG, VIDEO) -->
          <div class="media-upload-section">
            <div class="media-section-head">
              <span class="media-section-title">
                <lucide-angular [img]="Paperclip" [size]="15" />
                Attach Media (Choose Image, PDF, Song/Audio, or Video)
              </span>
            </div>

            @if (!attachedMedia()) {
              <div class="media-options-grid">
                <!-- 1. IMAGE OPTION -->
                <label class="media-option-card image-card">
                  <span class="option-icon image-icon"><lucide-angular [img]="FileImage" [size]="20" /></span>
                  <div class="option-text">
                    <strong>Photos / Image</strong>
                    <span>JPG, PNG, WebP</span>
                  </div>
                  <input
                    type="file"
                    (change)="onFileSelected($event, 'image')"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                    class="file-input-hidden"
                  />
                </label>

                <!-- 2. PDF / DOCUMENT OPTION -->
                <label class="media-option-card doc-card">
                  <span class="option-icon doc-icon"><lucide-angular [img]="FileText" [size]="20" /></span>
                  <div class="option-text">
                    <strong>PDF / Document</strong>
                    <span>PDF, Word, Docs</span>
                  </div>
                  <input
                    type="file"
                    (change)="onFileSelected($event, 'document')"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                    class="file-input-hidden"
                  />
                </label>

                <!-- 3. AUDIO / SONG OPTION -->
                <label class="media-option-card audio-card">
                  <span class="option-icon audio-icon"><lucide-angular [img]="Music" [size]="20" /></span>
                  <div class="option-text">
                    <strong>Songs / Audio</strong>
                    <span>MP3, WAV, Audio</span>
                  </div>
                  <input
                    type="file"
                    (change)="onFileSelected($event, 'audio')"
                    accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                    class="file-input-hidden"
                  />
                </label>

                <!-- 4. VIDEO OPTION -->
                <label class="media-option-card video-card">
                  <span class="option-icon video-icon"><lucide-angular [img]="Film" [size]="20" /></span>
                  <div class="option-text">
                    <strong>Video Clip</strong>
                    <span>MP4, MKV, MOV</span>
                  </div>
                  <input
                    type="file"
                    (change)="onFileSelected($event, 'video')"
                    accept="video/*,.mp4,.mkv,.mov,.avi"
                    class="file-input-hidden"
                  />
                </label>
              </div>
            } @else {
              <!-- ATTACHED MEDIA CARD -->
              <div class="attached-file-box page-enter">
                <div class="attached-thumb">
                  @if (attachedMedia()!.type === 'image') {
                    <img [src]="attachedMedia()!.dataUrl" alt="Preview" class="thumb-img" />
                  } @else if (attachedMedia()!.type === 'audio') {
                    <lucide-angular [img]="Music" [size]="24" class="attached-icon audio" />
                  } @else if (attachedMedia()!.type === 'video') {
                    <lucide-angular [img]="Film" [size]="24" class="attached-icon video" />
                  } @else {
                    <lucide-angular [img]="FileText" [size]="24" class="attached-icon doc" />
                  }
                </div>

                <div class="attached-info">
                  <div class="attached-name-row">
                    <strong>{{ attachedMedia()!.fileName }}</strong>
                    <span class="attached-tag">{{ attachedMedia()!.type.toUpperCase() }}</span>
                  </div>
                  <span class="attached-size">{{ formatBytes(attachedMedia()!.fileSize) }} &bull; Ready to send</span>
                </div>

                <button type="button" class="btn-remove-file" (click)="removeMedia()" title="Remove media">
                  <lucide-angular [img]="Trash2" [size]="16" />
                  <span>Remove</span>
                </button>
              </div>
            }
          </div>

          <!-- MESSAGE CONTENT (TEXT / CAPTION) -->
          <label class="field">
            <span>Message text {{ attachedMedia() ? '(Caption)' : '' }}</span>
            <textarea
              class="control message-body"
              formControlName="body"
              maxlength="4096"
              placeholder="Write your WhatsApp broadcast message or caption here..."
            ></textarea>
          </label>

          <div class="message-meta">
            <div class="var-buttons">
              <span>Variables:</span>
              <button type="button" class="var-tag" (click)="insertVariable('{{name}}')">
                <lucide-angular [img]="Sparkles" [size]="12" /> {{ '{{name}}' }}
              </button>
              <button type="button" class="var-tag" (click)="insertVariable('{{firstName}}')">
                <lucide-angular [img]="Sparkles" [size]="12" /> {{ '{{firstName}}' }}
              </button>
            </div>
            <span>{{ messageForm.controls.body.value.length }} / 4096</span>
          </div>

          <!-- SENDING SETTINGS -->
          <div class="delivery-throttle">
            <label class="throttle-label">
              <span>Anti-ban Safety Delay between messages:</span>
              <select class="control throttle-select" [ngModel]="delaySeconds()" (ngModelChange)="delaySeconds.set($event)" [ngModelOptions]="{ standalone: true }">
                <option [value]="0.5">0.5 seconds (Fast)</option>
                <option [value]="1">1.0 second (Recommended)</option>
                <option [value]="2">2.0 seconds (Safe)</option>
                <option [value]="3">3.0 seconds (Extra Safe)</option>
              </select>
            </label>
          </div>

          @if (error()) {
            <div class="form-error"><lucide-angular [img]="CircleAlert" [size]="16" />{{ error() }}</div>
          }
          @if (notice()) {
            <div class="form-notice"><lucide-angular [img]="CheckCircle2" [size]="16" />{{ notice() }}</div>
          }

          <!-- SUBMIT ACTION -->
          <div class="composer-actions">
            <span class="selection-summary">
              @if (targetMode() === 'multi') {
                <strong>{{ totalSelectedCount() }}</strong> targets ({{ selectedGroups().size }} groups + {{ selectedContacts().size }} contacts)
              } @else if (targetMode() === 'manual') {
                <strong>{{ parsedManualNumbers().length }}</strong> phone numbers ready
              } @else {
                Single message destination
              }
            </span>

            <button class="button button-primary send-btn" type="submit" [disabled]="sending() || (targetMode() === 'multi' && totalSelectedCount() === 0)">
              <lucide-angular [img]="Send" [size]="15" [class.spin]="sending()" />
              {{ sending() ? 'Sending in progress…' : 'Send WhatsApp Broadcast' }}
            </button>
          </div>
        </form>

        <!-- PREVIEW & LIVE RESULTS ASIDE -->
        <aside class="side-panel">
          <!-- LIVE MESSAGE PREVIEW -->
          <div class="preview-panel surface">
            <div class="preview-heading">
              <lucide-angular [img]="MessageSquareText" [size]="17" />
              <strong>WhatsApp Message Preview</strong>
            </div>

            <div class="chat-preview">
              <span class="preview-label">Live Preview</span>
              
              @if (attachedMedia(); as media) {
                <div class="preview-media-box">
                  @if (media.type === 'image') {
                    <img [src]="media.dataUrl" alt="Preview" class="chat-img-preview" />
                  } @else {
                    <div class="chat-file-preview">
                      <lucide-angular [img]="media.type === 'audio' ? Music : (media.type === 'video' ? Film : FileText)" [size]="20" />
                      <span>{{ media.fileName }}</span>
                    </div>
                  }
                </div>
              }

              <p>{{ getPreviewText() }}</p>
              <small>{{ messageForm.controls.body.value.length }} chars</small>
            </div>

            <div class="preview-info">
              <strong>Delivering to:</strong>
              @if (targetMode() === 'multi') {
                <span>{{ selectedGroups().size }} Groups &bull; {{ selectedContacts().size }} Contacts (Total: {{ totalSelectedCount() }})</span>
              } @else if (targetMode() === 'manual') {
                <span>{{ parsedManualNumbers().length }} Manual Numbers</span>
              } @else {
                <span>{{ messageForm.controls.recipient.value || 'No recipient set' }}</span>
              }
            </div>
          </div>

          <!-- SEND RESULTS LIST -->
          @if (lastResult()) {
            <div class="results-panel surface page-enter">
              <div class="results-head">
                <strong>Delivery Summary</strong>
                <span class="stats-badge">
                  {{ lastResult()!.sent }} Sent / {{ lastResult()!.total }} Total
                </span>
              </div>

              <div class="results-list">
                @for (item of lastResult()!.details; track item.target) {
                  <div class="result-row" [class.success]="item.success" [class.failed]="!item.success">
                    <span class="result-icon">
                      @if (item.success) {
                        <lucide-angular [img]="CheckCircle2" [size]="14" />
                      } @else {
                        <lucide-angular [img]="XCircle" [size]="14" />
                      }
                    </span>
                    <div class="result-meta">
                      <strong>{{ item.name || item.target }}</strong>
                      <span class="result-status">{{ item.success ? 'Delivered' : (item.error || 'Failed') }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .mode-tabs { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
    .tab-btn { display:inline-flex; align-items:center; gap:8px; padding:9px 16px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--ink-soft); font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s ease; }
    .tab-btn:hover { background:var(--surface-muted); color:var(--ink); border-color:var(--green); }
    .tab-btn.active { background:var(--green); color:#fff; border-color:var(--green); box-shadow:0 3px 10px rgba(23,107,74,0.2); }
    [data-theme="dark"] .tab-btn.active { color:#0d1612; }
    .tab-badge { background:#fff; color:#176b4a; font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; }
    [data-theme="dark"] .tab-badge { background:#0d1612; color:#25d366; }

    .composer-layout { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr); align-items:start; gap:16px; }
    .composer { display:grid; gap:16px; padding:22px; }

    .multi-select-container { display:grid; gap:14px; }
    .selection-actions-bar { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; background:var(--surface-muted); border:1px solid var(--line); border-radius:8px; flex-wrap:wrap; }
    .selection-summary-badge { font-size:12px; color:var(--ink); }
    .quick-select-btns { display:flex; align-items:center; gap:8px; }
    .btn-sm-action { border:1px solid var(--line); background:var(--surface); color:var(--ink); font-size:11px; font-weight:600; padding:4px 9px; border-radius:6px; cursor:pointer; }
    .btn-sm-action:hover { border-color:var(--green); background:var(--green-wash); color:var(--green); }
    .btn-sm-clear { border:1px solid var(--coral); background:var(--coral-wash); color:var(--coral); font-size:11px; font-weight:600; padding:4px 9px; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:4px; }

    .selector-section { border:1px solid var(--line); border-radius:8px; padding:12px; background:var(--surface-muted); }
    .selector-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:9px; }
    .title-with-count { display:flex; align-items:center; gap:6px; color:var(--green); font-size:12px; }
    .title-with-count strong { color:var(--ink); }
    .selected-badge { background:var(--green); color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; margin-left:4px; }
    [data-theme="dark"] .selected-badge { color:#0d1612; }
    .action-link { border:0; background:none; color:var(--green); font-size:11px; font-weight:700; cursor:pointer; text-decoration:underline; }
    .search-mini input { width:100%; height:32px; border:1px solid var(--line); border-radius:6px; padding:0 10px; font-size:11px; background:var(--surface); color:var(--ink); }
    .pills-grid { display:flex; flex-wrap:wrap; gap:6px; max-height:165px; overflow-y:auto; margin-top:8px; padding:2px; }
    .pill-card { display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border:1px solid var(--line); border-radius:6px; background:var(--surface); color:var(--ink); font-size:11px; cursor:pointer; text-align:left; max-width:100%; transition:all 0.12s ease; }
    .pill-card:hover { border-color:var(--green); background:var(--green-wash); }
    .pill-card.selected { background:var(--green); color:#fff; border-color:var(--green); font-weight:600; }
    [data-theme="dark"] .pill-card.selected { color:#0d1612; }
    .pill-check { font-size:10px; font-weight:700; }
    .pill-title { max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pill-meta { font-size:9px; opacity:0.75; font-family:monospace; }
    .loading-hint,.empty-hint { color:var(--ink-faint); font-size:11px; margin:6px 0; font-style:italic; }
    .manual-textarea { min-height:100px; font-family:monospace; font-size:11px; }

    /* SEPARATE DEDICATED 4 MEDIA BUTTONS */
    .media-upload-section { border:1px dashed var(--line); border-radius:9px; padding:14px; background:var(--surface-muted); }
    .media-section-head { margin-bottom:12px; }
    .media-section-title { display:flex; align-items:center; gap:7px; color:var(--ink); font-size:12px; font-weight:700; }
    
    .media-options-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; }
    .media-option-card { display:flex; flex-direction:column; align-items:center; text-align:center; padding:14px 10px; border-radius:8px; border:1px solid var(--line); background:var(--surface); cursor:pointer; transition:all 0.18s ease; }
    .media-option-card:hover { transform:translateY(-2px); border-color:var(--green); box-shadow:0 4px 12px rgba(0,0,0,0.06); }
    .file-input-hidden { display:none; }

    .option-icon { width:38px; height:38px; border-radius:8px; display:grid; place-items:center; margin-bottom:8px; }
    .image-icon { background:#e8f7ee; color:#176b4a; }
    .doc-icon { background:#f3ecfa; color:#7839ee; }
    .audio-icon { background:#e7f1fc; color:#1967d2; }
    .video-icon { background:#fdf1e8; color:#d96b56; }
    [data-theme="dark"] .image-icon { background:rgba(37,211,102,0.15); color:#25d366; }
    [data-theme="dark"] .doc-icon { background:rgba(120,57,238,0.15); color:#a77bf7; }
    [data-theme="dark"] .audio-icon { background:rgba(25,103,210,0.15); color:#5ea1f8; }
    [data-theme="dark"] .video-icon { background:rgba(217,107,86,0.15); color:#f78a74; }

    .option-text strong { display:block; font-size:11px; color:var(--ink); margin-bottom:2px; }
    .option-text span { font-size:9px; color:var(--ink-soft); }

    /* ATTACHED FILE ROW */
    .attached-file-box { display:flex; align-items:center; gap:12px; padding:10px 14px; background:var(--surface); border:1px solid var(--line); border-radius:8px; }
    .attached-thumb { width:48px; height:48px; border-radius:6px; background:var(--surface-muted); display:flex; align-items:center; justify-content:center; overflow:hidden; flex:none; }
    .thumb-img { width:100%; height:100%; object-fit:cover; }
    .attached-icon.audio { color:#1967d2; }
    .attached-icon.video { color:#d96b56; }
    .attached-icon.doc { color:#7839ee; }
    .attached-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
    .attached-name-row { display:flex; align-items:center; gap:8px; }
    .attached-name-row strong { font-size:12px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .attached-tag { background:var(--green-wash); color:var(--green); font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; }
    .attached-size { font-size:10px; color:var(--ink-soft); }
    .btn-remove-file { display:inline-flex; align-items:center; gap:5px; border:1px solid var(--coral); background:var(--coral-wash); color:var(--coral); padding:6px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; }
    .btn-remove-file:hover { background:var(--coral); color:#fff; }

    .message-body { min-height:130px!important; font-size:13px; line-height:1.5; }
    .message-meta { display:flex; justify-content:space-between; align-items:center; color:var(--ink-soft); font-size:11px; }
    .var-buttons { display:flex; align-items:center; gap:6px; }
    .var-tag { display:inline-flex; align-items:center; gap:4px; border:1px solid var(--line); background:var(--surface); color:var(--green); padding:3px 7px; border-radius:4px; font-size:11px; font-family:monospace; cursor:pointer; }
    .var-tag:hover { background:var(--green-wash); }
    .delivery-throttle { border-top:1px solid var(--line); padding-top:12px; }
    .throttle-label { display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:11px; color:var(--ink-soft); }
    .throttle-select { width:auto; height:32px; padding:0 8px; font-size:11px; }
    .composer-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; border-top:1px solid var(--line); padding-top:14px; }
    .selection-summary { font-size:12px; color:var(--ink); }
    .send-btn { min-height:38px; padding:0 18px; font-size:12px; font-weight:700; }
    .side-panel { display:grid; gap:14px; }
    .preview-panel { padding:17px; }
    .preview-heading { display:flex; align-items:center; gap:8px; padding-bottom:12px; color:var(--green); }
    .preview-heading strong { color:var(--ink); font-size:12px; }
    .chat-preview { min-height:100px; border:1px solid var(--line); border-radius:7px; background:var(--surface-muted); padding:12px; }
    .preview-label { color:var(--ink-faint); font-size:9px; font-weight:700; text-transform:uppercase; }
    .preview-media-box { margin:8px 0 6px; }
    .chat-img-preview { max-width:100%; max-height:140px; border-radius:6px; object-fit:cover; }
    .chat-file-preview { display:flex; align-items:center; gap:7px; background:var(--green-wash); padding:6px 10px; border-radius:6px; font-size:11px; color:var(--green); font-weight:600; }
    .chat-preview p { margin:8px 0 10px; color:var(--ink); font-size:12px; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere; }
    .chat-preview small { display:block; color:var(--ink-faint); font-size:9px; text-align:right; }
    .preview-info { display:grid; gap:4px; margin-top:14px; border-top:1px solid var(--line); padding-top:12px; }
    .preview-info strong { color:var(--ink-faint); font-size:10px; }
    .preview-info span { color:var(--ink); font-size:11px; overflow-wrap:anywhere; }
    .results-panel { padding:16px; }
    .results-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .stats-badge { background:var(--green-wash); color:var(--green); font-size:11px; font-weight:700; padding:3px 8px; border-radius:10px; }
    .results-list { display:grid; gap:6px; max-height:220px; overflow-y:auto; }
    .result-row { display:flex; align-items:center; gap:8px; padding:7px 9px; border-radius:6px; font-size:11px; }
    .result-row.success { background:var(--green-wash); border:1px solid var(--green); color:var(--green); }
    .result-row.failed { background:var(--coral-wash); border:1px solid var(--coral); color:var(--coral); }
    .result-meta { display:flex; flex-direction:column; }
    .result-meta strong { font-size:11px; }
    .result-status { font-size:10px; opacity:0.85; }
    .form-error { display:flex; align-items:center; gap:8px; color:var(--coral); font-size:11px; background:var(--coral-wash); padding:8px 10px; border-radius:6px; border:1px solid var(--coral); }
    .form-notice { display:flex; align-items:center; gap:8px; color:var(--green); font-size:11px; background:var(--green-wash); padding:8px 10px; border-radius:6px; border:1px solid var(--green); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @media(max-width:860px) { .composer-layout { grid-template-columns:1fr; } .media-options-grid { grid-template-columns:repeat(2, 1fr); } }
  `],
})
export class SendMessageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly targetMode = signal<'multi' | 'manual' | 'single'>('multi');
  readonly sending = signal(false);
  readonly loadingData = signal(true);
  readonly error = signal('');
  readonly notice = signal('');

  readonly contacts = signal<Contact[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly contactSearch = signal('');
  readonly groupSearch = signal('');

  readonly selectedContacts = signal<Set<string>>(new Set());
  readonly selectedGroups = signal<Set<string>>(new Set());
  readonly manualNumbersText = signal('');
  readonly delaySeconds = signal<number>(1);
  readonly lastResult = signal<BulkSendResult | null>(null);

  readonly attachedMedia = signal<AttachedMedia | null>(null);

  readonly MessageSquareText = MessageSquareText;
  readonly CircleAlert = CircleAlert;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Send = Send;
  readonly Users = Users;
  readonly UsersRound = UsersRound;
  readonly Layers = Layers;
  readonly Phone = Phone;
  readonly Sparkles = Sparkles;
  readonly RefreshCw = RefreshCw;
  readonly Paperclip = Paperclip;
  readonly Upload = Upload;
  readonly File = File;
  readonly FileText = FileText;
  readonly FileImage = FileImage;
  readonly Film = Film;
  readonly Music = Music;
  readonly Trash2 = Trash2;
  readonly X = X;

  readonly messageForm = this.formBuilder.nonNullable.group({
    recipient: [''],
    body: ['', [Validators.maxLength(4096)]],
  });

  ngOnInit(): void {
    this.loadContactsAndGroups();

    this.route.queryParams.subscribe((params) => {
      const rec = params['recipients'] || params['recipient'];
      if (rec) {
        const phoneList = String(rec).split(',').map((p) => p.trim()).filter(Boolean);
        this.targetMode.set('multi');
        this.selectedContacts.update((set) => {
          const next = new Set(set);
          phoneList.forEach((p) => next.add(p));
          return next;
        });
        if (phoneList.length === 1 && !params['recipients']) {
          this.messageForm.controls.recipient.setValue(phoneList[0]);
        }
      }

      const grp = params['groups'] || params['group'];
      if (grp) {
        const groupList = String(grp).split(',').map((g) => g.trim()).filter(Boolean);
        this.targetMode.set('multi');
        this.selectedGroups.update((set) => {
          const next = new Set(set);
          groupList.forEach((g) => next.add(g));
          return next;
        });
      }
    });
  }

  loadContactsAndGroups(): void {
    this.loadingData.set(true);
    this.api.get<PageResult<Contact>>('contacts', { limit: '200' }).subscribe({
      next: (res) => {
        this.contacts.set(res.items || []);
        this.api.get<PageResult<Group>>('groups', { limit: '200' }).subscribe({
          next: (gRes) => {
            this.groups.set(gRes.items || []);
            this.loadingData.set(false);
          },
          error: () => this.loadingData.set(false),
        });
      },
      error: () => this.loadingData.set(false),
    });
  }

  filteredContacts(): Contact[] {
    const s = this.contactSearch().trim().toLowerCase();
    if (!s) return this.contacts();
    return this.contacts().filter((c) =>
      [c.displayName ?? '', c.phoneE164].join(' ').toLowerCase().includes(s),
    );
  }

  filteredGroups(): Group[] {
    const s = this.groupSearch().trim().toLowerCase();
    if (!s) return this.groups();
    return this.groups().filter((g) =>
      [g.name, g.providerGroupId].join(' ').toLowerCase().includes(s),
    );
  }

  isContactSelected(phone: string): boolean {
    return this.selectedContacts().has(phone);
  }

  toggleContact(phone: string): void {
    this.selectedContacts.update((set) => {
      const next = new Set(set);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  allContactsSelected(): boolean {
    const list = this.filteredContacts();
    return list.length > 0 && list.every((c) => this.selectedContacts().has(c.phoneE164));
  }

  toggleAllContacts(): void {
    const list = this.filteredContacts();
    const all = this.allContactsSelected();
    this.selectedContacts.update((set) => {
      const next = new Set(set);
      for (const c of list) {
        if (all) next.delete(c.phoneE164);
        else next.add(c.phoneE164);
      }
      return next;
    });
  }

  isGroupSelected(id: string): boolean {
    return this.selectedGroups().has(id);
  }

  toggleGroup(id: string): void {
    this.selectedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  allGroupsSelected(): boolean {
    const list = this.filteredGroups();
    return list.length > 0 && list.every((g) => this.selectedGroups().has(g.providerGroupId));
  }

  toggleAllGroups(): void {
    const list = this.filteredGroups();
    const all = this.allGroupsSelected();
    this.selectedGroups.update((set) => {
      const next = new Set(set);
      for (const g of list) {
        if (all) next.delete(g.providerGroupId);
        else next.add(g.providerGroupId);
      }
      return next;
    });
  }

  clearAllSelections(): void {
    this.selectedContacts.set(new Set());
    this.selectedGroups.set(new Set());
  }

  totalSelectedCount(): number {
    return this.selectedContacts().size + this.selectedGroups().size;
  }

  parsedManualNumbers(): string[] {
    const raw = this.manualNumbersText();
    return raw
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter((n) => n.length >= 7);
  }

  onFileSelected(event: Event, expectedType?: 'image' | 'video' | 'audio' | 'document'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const commaIndex = dataUrl.indexOf(',');
      const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;

      let type: 'image' | 'video' | 'audio' | 'document' = expectedType || 'document';
      if (!expectedType) {
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
      }

      this.attachedMedia.set({
        base64,
        dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mimetype: file.type || 'application/octet-stream',
        type,
      });
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeMedia(): void {
    this.attachedMedia.set(null);
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  insertVariable(v: string): void {
    const cur = this.messageForm.controls.body.value;
    this.messageForm.controls.body.setValue(`${cur} ${v} `);
    this.messageForm.controls.body.markAsDirty();
  }

  getPreviewText(): string {
    const text = this.messageForm.controls.body.value || (this.attachedMedia() ? '' : 'Your WhatsApp broadcast message preview appears here.');
    return text.replace(/\{\{name\}\}/gi, 'John Doe').replace(/\{\{firstName\}\}/gi, 'John');
  }

  sendMessage(): void {
    this.error.set('');
    this.notice.set('');
    this.lastResult.set(null);

    const body = this.messageForm.controls.body.value.trim();
    const media = this.attachedMedia();

    if (!body && !media) {
      this.error.set('Please enter message text or select an attachment.');
      return;
    }

    const mode = this.targetMode();
    const delayMs = Number(this.delaySeconds()) * 1000;

    let payload: any = { body, delayMs };

    if (media) {
      payload.media = {
        base64: media.base64,
        fileName: media.fileName,
        mimetype: media.mimetype,
        type: media.type,
      };
    }

    if (mode === 'multi') {
      const recipients = Array.from(this.selectedContacts());
      const groups = Array.from(this.selectedGroups());

      if (recipients.length === 0 && groups.length === 0) {
        this.error.set('Please select at least one WhatsApp group or contact.');
        return;
      }
      payload.recipients = recipients;
      payload.groups = groups;
    } else if (mode === 'manual') {
      const numbers = this.parsedManualNumbers();
      if (numbers.length === 0) {
        this.error.set('Please enter at least one valid phone number.');
        return;
      }
      payload.manualNumbers = numbers;
    } else {
      const recipient = this.messageForm.controls.recipient.value.trim();
      if (!recipient) {
        this.error.set('Please enter a recipient phone number or group ID.');
        return;
      }
      payload.recipient = recipient;
    }

    this.sending.set(true);

    this.api.post<BulkSendResult | any>('messages/send', payload).subscribe({
      next: (res) => {
        this.sending.set(false);
        const data = res?.data || res;
        if (data && data.details) {
          this.lastResult.set(data);
          this.notice.set(`Broadcast complete! Sent ${data.sent} of ${data.total} messages successfully.`);
        } else {
          this.notice.set('Message sent successfully!');
        }
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(
          err?.error?.message ||
            'Failed to send message. Make sure WhatsApp is connected in Channels.',
        );
      },
    });
  }
}
