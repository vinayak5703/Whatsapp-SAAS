import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CheckCircle2,
  CircleAlert,
  ContactRound,
  FileImage,
  FileText,
  Film,
  LucideAngularModule,
  MessageSquare,
  Music,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-angular';
import { Contact, PageResult } from '../../../core/models/api.models';
import { ApiService } from '../../../core/services/api.service';

interface AttachedMedia {
  base64: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  mimetype: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div>
          <p class="eyebrow">Address book</p>
          <h1>Contacts</h1>
          <p class="page-subtitle">Select multiple contacts (10, 20 or all) to broadcast WhatsApp messages & media at once.</p>
        </div>
        <div class="header-actions">
          <button class="button button-primary" type="button" (click)="syncContacts()" [disabled]="syncing()">
            <lucide-angular [img]="RefreshCw" [size]="15" [class.spin]="syncing()" />
            {{ syncing() ? 'Syncing…' : 'Sync from WhatsApp' }}
          </button>
          <a class="button button-secondary" routerLink="/messages/send">
            <lucide-angular [img]="Send" [size]="15" />Compose Message
          </a>
        </div>
      </div>

      @if (notice()) { <div class="notice">{{ notice() }}</div> }

      <section class="list-panel surface">
        <div class="list-toolbar">
          <label class="search-field">
            <lucide-angular [img]="Search" [size]="16" />
            <input [value]="search()" (input)="updateSearch($event)" placeholder="Search name or mobile number" aria-label="Search contacts">
          </label>
          <div class="toolbar-right">
            <button class="button button-secondary" type="button" (click)="toggleSelectAll()" [disabled]="contacts().length === 0">
              {{ allSelected() ? 'Deselect All' : 'Select All (' + contacts().length + ')' }}
            </button>
            <button class="button button-secondary" type="button" (click)="loadContacts()" [disabled]="loading()">
              <lucide-angular [img]="RefreshCw" [size]="15" />Refresh
            </button>
          </div>
        </div>

        @if (error()) {
          <div class="list-state error-state">
            <lucide-angular [img]="CircleAlert" [size]="20" />
            <strong>Contacts could not be loaded</strong>
            <span>{{ error() }}</span>
          </div>
        } @else if (loading()) {
          <div class="list-state">Loading contacts…</div>
        } @else if (contacts().length === 0) {
          <div class="list-state">
            <span class="empty-icon"><lucide-angular [img]="ContactRound" [size]="20" /></span>
            <strong>{{ search() ? 'No matching contacts' : 'No contacts yet' }}</strong>
            <span>{{ search() ? 'Try another name or number.' : 'Scan WhatsApp QR code in the Channels tab or click Sync from WhatsApp.' }}</span>
            @if (!search()) {
              <button class="button button-primary" type="button" (click)="syncContacts()" [disabled]="syncing()">
                <lucide-angular [img]="RefreshCw" [size]="15" />Sync from WhatsApp
              </button>
            }
          </div>
        } @else {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">
                    <input type="checkbox" class="cb-custom" [checked]="allSelected()" (change)="toggleSelectAll()" aria-label="Select all contacts">
                  </th>
                  <th>Name / Number</th>
                  <th>Mobile number</th>
                  <th>Email</th>
                  <th>Sync Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (contact of contacts(); track contact.id) {
                  <tr [class.row-selected]="isSelected(contact.phoneE164)">
                    <td>
                      <input
                        type="checkbox"
                        class="cb-custom"
                        [checked]="isSelected(contact.phoneE164)"
                        (change)="toggleSelect(contact.phoneE164)"
                      >
                    </td>
                    <td>
                      <span class="contact-name">
                        <span class="person-icon"><lucide-angular [img]="UserRound" [size]="15" /></span>
                        {{ contact.displayName || contact.phoneE164 || 'WhatsApp User' }}
                      </span>
                    </td>
                    <td><span class="phone-badge">{{ contact.phoneE164 }}</span></td>
                    <td class="muted-cell">{{ contact.email || '—' }}</td>
                    <td class="muted-cell">{{ contact.createdAt | date:'mediumDate' }}</td>
                    <td>
                      <button class="row-btn" type="button" (click)="openQuickModal([contact.phoneE164], contact.displayName || contact.phoneE164)">
                        <lucide-angular [img]="MessageSquare" [size]="13" /> Message
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="list-footer">
            <span>{{ total() ?? contacts().length }} total contacts &bull; {{ selectedContactPhones().size }} selected</span>
            <div class="pagination">
              <button type="button" class="button button-secondary" (click)="loadPrevious()" [disabled]="!previousCursor() || loading()">Previous</button>
              <button type="button" class="button button-secondary" (click)="loadNext()" [disabled]="!nextCursor() || loading()">Next</button>
            </div>
          </div>
        }
      </section>

      <!-- FLOATING ACTION BAR FOR MULTI-SELECT -->
      @if (selectedContactPhones().size > 0) {
        <div class="floating-bar page-enter">
          <div class="floating-content">
            <div class="floating-info">
              <span class="badge-count">{{ selectedContactPhones().size }}</span>
              <strong>Contacts Selected</strong>
            </div>
            <div class="floating-buttons">
              <button class="btn-clear" type="button" (click)="clearSelection()">
                <lucide-angular [img]="X" [size]="14" /> Clear
              </button>
              <button class="button button-primary btn-broadcast" type="button" (click)="openQuickModal(selectedContactsArray())">
                <lucide-angular [img]="Send" [size]="15" />
                Send Message & Media to {{ selectedContactPhones().size }} Contacts
              </button>
            </div>
          </div>
        </div>
      }

      <!-- QUICK BROADCAST & MEDIA MODAL -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card surface page-enter" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h2 class="modal-title">Send WhatsApp Broadcast</h2>
                <p class="modal-subtitle">Sending to <strong>{{ modalTargetCount() }}</strong> contact(s)</p>
              </div>
              <button type="button" class="btn-close-modal" (click)="closeModal()">
                <lucide-angular [img]="X" [size]="18" />
              </button>
            </div>

            <!-- 4 SEPARATE MEDIA BUTTONS -->
            <div class="modal-media-section">
              <span class="media-title">
                <lucide-angular [img]="Paperclip" [size]="14" />
                Attach Media (Choose Image, PDF, Song/Audio, or Video)
              </span>

              @if (!attachedMedia()) {
                <div class="media-grid-modal">
                  <label class="media-tile image-tile">
                    <lucide-angular [img]="FileImage" [size]="18" />
                    <strong>Photos / Image</strong>
                    <input type="file" (change)="onFileSelected($event, 'image')" accept="image/*" class="file-hidden" />
                  </label>
                  <label class="media-tile doc-tile">
                    <lucide-angular [img]="FileText" [size]="18" />
                    <strong>PDF / Document</strong>
                    <input type="file" (change)="onFileSelected($event, 'document')" accept=".pdf,.doc,.docx,.txt" class="file-hidden" />
                  </label>
                  <label class="media-tile audio-tile">
                    <lucide-angular [img]="Music" [size]="18" />
                    <strong>Songs / Audio</strong>
                    <input type="file" (change)="onFileSelected($event, 'audio')" accept="audio/*,.mp3,.wav,.ogg,.m4a" class="file-hidden" />
                  </label>
                  <label class="media-tile video-tile">
                    <lucide-angular [img]="Film" [size]="18" />
                    <strong>Video Clip</strong>
                    <input type="file" (change)="onFileSelected($event, 'video')" accept="video/*,.mp4,.mov,.mkv" class="file-hidden" />
                  </label>
                </div>
              } @else {
                <div class="attached-card">
                  <div class="attached-icon-box">
                    @if (attachedMedia()!.type === 'image') {
                      <img [src]="attachedMedia()!.dataUrl" alt="Thumb" class="thumb-img" />
                    } @else if (attachedMedia()!.type === 'audio') {
                      <lucide-angular [img]="Music" [size]="20" />
                    } @else if (attachedMedia()!.type === 'video') {
                      <lucide-angular [img]="Film" [size]="20" />
                    } @else {
                      <lucide-angular [img]="FileText" [size]="20" />
                    }
                  </div>
                  <div class="attached-meta">
                    <strong>{{ attachedMedia()!.fileName }}</strong>
                    <span>{{ attachedMedia()!.type.toUpperCase() }} &bull; {{ formatBytes(attachedMedia()!.fileSize) }}</span>
                  </div>
                  <button type="button" class="btn-del-file" (click)="removeMedia()">
                    <lucide-angular [img]="Trash2" [size]="15" />
                  </button>
                </div>
              }
            </div>

            <!-- MESSAGE TEXT -->
            <label class="field modal-field">
              <span>Message text {{ attachedMedia() ? '(Caption)' : '' }}</span>
              <textarea
                class="control modal-textarea"
                [(ngModel)]="messageBody"
                placeholder="Write your WhatsApp message or caption here..."
              ></textarea>
            </label>

            @if (modalError()) {
              <div class="modal-error"><lucide-angular [img]="CircleAlert" [size]="15" />{{ modalError() }}</div>
            }
            @if (modalSuccess()) {
              <div class="modal-success"><lucide-angular [img]="CheckCircle2" [size]="15" />{{ modalSuccess() }}</div>
            }

            <div class="modal-actions">
              <button type="button" class="button button-secondary" (click)="goToFullComposer()">
                Open Full Composer
              </button>
              <button
                type="button"
                class="button button-primary modal-send-btn"
                (click)="sendModalBroadcast()"
                [disabled]="modalSending()"
              >
                <lucide-angular [img]="Send" [size]="14" [class.spin]="modalSending()" />
                {{ modalSending() ? 'Sending broadcast…' : 'Send to ' + modalTargetCount() + ' Contact(s)' }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .list-panel { overflow:hidden; position:relative; }
    .header-actions { display:flex; gap:9px; align-items:center; }
    .list-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:14px 16px; flex-wrap:wrap; }
    .toolbar-right { display:flex; gap:8px; align-items:center; }
    .search-field { display:flex; width:min(100%,320px); height:38px; align-items:center; gap:8px; border:1px solid var(--line); border-radius:6px; padding:0 10px; color:var(--ink-soft); background:var(--surface); }
    .search-field input { width:100%; min-width:0; border:0; outline:0; color:var(--ink); font-size:12px; background:transparent; }
    .cb-custom { width:17px; height:17px; accent-color:var(--green); cursor:pointer; }
    .row-selected { background:var(--green-wash)!important; }
    .list-state { display:grid; min-height:270px; place-content:center; justify-items:center; gap:9px; padding:28px; color:var(--ink-soft); font-size:12px; text-align:center; }
    .list-state strong { color:var(--ink); font-family:Manrope,sans-serif; font-size:14px; }
    .list-state span { max-width:360px; line-height:1.5; }
    .error-state { color:var(--coral); }
    .empty-icon,.person-icon { display:grid; width:39px; height:39px; place-items:center; border-radius:50%; background:var(--green-wash); color:var(--green); }
    .contact-name { display:flex; align-items:center; gap:9px; font-weight:700; color:var(--ink); }
    .person-icon { width:28px; height:28px; flex:none; }
    .phone-badge { font-family:monospace; color:var(--green); background:var(--green-wash); padding:2px 7px; border-radius:4px; font-size:11px; }
    .row-btn { display:inline-flex; align-items:center; gap:5px; border:1px solid var(--line); background:var(--surface); color:var(--green); font-size:11px; font-weight:600; padding:4px 9px; border-radius:5px; cursor:pointer; }
    .row-btn:hover { background:var(--green-wash); }
    .notice { margin:-10px 0 15px; border:1px solid var(--green); border-radius:6px; background:var(--green-wash); padding:10px 12px; color:var(--green); font-size:12px; }
    .list-footer { display:flex; min-height:57px; align-items:center; justify-content:space-between; border-top:1px solid var(--line); padding:8px 15px; color:var(--ink-soft); font-size:11px; }
    .pagination { display:flex; gap:7px; }
    .pagination .button { min-height:31px; padding:0 10px; font-size:10px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* FLOATING ACTION BAR */
    .floating-bar { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:100; width:min(90%, 650px); background:#15281e; color:#fff; border-radius:12px; padding:12px 18px; box-shadow:0 12px 35px rgba(0,0,0,0.4); border:1px solid #284435; }
    .floating-content { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; }
    .floating-info { display:flex; align-items:center; gap:10px; font-size:13px; }
    .badge-count { background:var(--green); color:#fff; font-weight:800; padding:3px 10px; border-radius:20px; font-size:12px; }
    [data-theme="dark"] .badge-count { color:#0d1612; }
    .floating-buttons { display:flex; align-items:center; gap:10px; }
    .btn-clear { background:none; border:0; color:#a2b8ab; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:4px; }
    .btn-clear:hover { color:#fff; }
    .btn-broadcast { background:#25d366; color:#0f2b18; font-weight:700; border:0; box-shadow:0 4px 14px rgba(37,211,102,0.3); }
    .btn-broadcast:hover { background:#20bd5a; }

    /* MODAL STYLES */
    .modal-backdrop { position:fixed; inset:0; z-index:200; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px); }
    .modal-card { width:min(100%, 540px); border-radius:12px; padding:22px; display:grid; gap:14px; max-height:90vh; overflow-y:auto; }
    .modal-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .modal-title { font-size:16px; margin:0 0 2px; color:var(--ink); }
    .modal-subtitle { font-size:12px; margin:0; color:var(--ink-soft); }
    .btn-close-modal { border:0; background:none; color:var(--ink-soft); cursor:pointer; padding:4px; }
    .modal-media-section { border:1px dashed var(--line); border-radius:8px; padding:12px; background:var(--surface-muted); display:grid; gap:10px; }
    .media-title { font-size:11px; font-weight:700; color:var(--ink); display:flex; align-items:center; gap:6px; }
    .media-grid-modal { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; }
    .media-tile { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:10px 4px; border:1px solid var(--line); border-radius:6px; background:var(--surface); cursor:pointer; text-align:center; font-size:10px; color:var(--ink); transition:all 0.15s; }
    .media-tile:hover { border-color:var(--green); background:var(--green-wash); }
    .image-tile lucide-angular { color:var(--green); }
    .doc-tile lucide-angular { color:#7839ee; }
    .audio-tile lucide-angular { color:#1967d2; }
    .video-tile lucide-angular { color:#d96b56; }
    .file-hidden { display:none; }
    .attached-card { display:flex; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--line); border-radius:6px; padding:8px 10px; }
    .attached-icon-box { width:38px; height:38px; border-radius:6px; background:var(--surface-muted); display:flex; align-items:center; justify-content:center; overflow:hidden; flex:none; }
    .thumb-img { width:100%; height:100%; object-fit:cover; }
    .attached-meta { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
    .attached-meta strong { font-size:11px; color:var(--ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .attached-meta span { font-size:9px; color:var(--ink-soft); }
    .btn-del-file { border:0; background:none; color:var(--coral); cursor:pointer; padding:4px; }
    .modal-field { margin-top:2px; }
    .modal-textarea { min-height:95px; font-size:12px; }
    .modal-actions { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:6px; }
    .modal-send-btn { min-height:38px; font-size:12px; }
    .modal-error { display:flex; align-items:center; gap:6px; color:var(--coral); font-size:11px; background:var(--coral-wash); padding:8px 10px; border-radius:6px; }
    .modal-success { display:flex; align-items:center; gap:6px; color:var(--green); font-size:11px; background:var(--green-wash); padding:8px 10px; border-radius:6px; }

    @media(max-width:650px) { .header-actions { flex-direction:column; align-items:stretch; } .list-toolbar { align-items:stretch; flex-direction:column; } .search-field { width:100%; } .list-footer { align-items:flex-start; flex-direction:column; gap:8px; } .floating-content { flex-direction:column; align-items:stretch; } .btn-broadcast { width:100%; } .media-grid-modal { grid-template-columns:repeat(2, 1fr); } }
  `],
})
export class ContactListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly contacts = signal<Contact[]>([]);
  readonly selectedContactPhones = signal<Set<string>>(new Set());
  readonly search = signal('');
  readonly loading = signal(true);
  readonly syncing = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly total = signal<number | null>(null);
  readonly nextCursor = signal<string | null>(null);
  readonly previousCursor = signal<string | null>(null);

  // Modal State
  readonly showModal = signal(false);
  readonly modalTargets = signal<string[]>([]);
  readonly modalSending = signal(false);
  readonly modalError = signal('');
  readonly modalSuccess = signal('');
  readonly attachedMedia = signal<AttachedMedia | null>(null);
  messageBody = '';

  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly CircleAlert = CircleAlert;
  readonly CheckCircle2 = CheckCircle2;
  readonly ContactRound = ContactRound;
  readonly UserRound = UserRound;
  readonly Send = Send;
  readonly MessageSquare = MessageSquare;
  readonly Paperclip = Paperclip;
  readonly FileImage = FileImage;
  readonly FileText = FileText;
  readonly Music = Music;
  readonly Film = Film;
  readonly Trash2 = Trash2;
  readonly X = X;

  private currentCursor: string | null = null;

  ngOnInit(): void { this.loadContacts(); }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.currentCursor = null;
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading.set(true);
    this.error.set('');
    const query: Record<string, string> = { limit: '100' };
    if (this.search()) query['search'] = this.search();
    if (this.currentCursor) query['cursor'] = this.currentCursor;

    this.api.get<PageResult<Contact>>('contacts', query).subscribe({
      next: (result) => {
        this.contacts.set(result.items || []);
        this.total.set(result.total ?? result.items.length);
        this.nextCursor.set(result.nextCursor ?? null);
        this.previousCursor.set(this.currentCursor);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load contacts. Verify WhatsApp connection.');
        this.contacts.set([]);
        this.loading.set(false);
      },
    });
  }

  syncContacts(): void {
    this.syncing.set(true);
    this.notice.set('');
    this.api.post('contacts/sync', {}).subscribe({
      next: (res: any) => {
        const count = res?.data?.length ?? 0;
        this.notice.set(`Successfully synced ${count} contacts from WhatsApp.`);
        this.syncing.set(false);
        this.loadContacts();
      },
      error: () => {
        this.notice.set('Contact sync failed. Make sure WhatsApp is connected in the Channels tab.');
        this.syncing.set(false);
      },
    });
  }

  isSelected(phone: string): boolean {
    return this.selectedContactPhones().has(phone);
  }

  toggleSelect(phone: string): void {
    this.selectedContactPhones.update((set) => {
      const next = new Set(set);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  allSelected(): boolean {
    const list = this.contacts();
    return list.length > 0 && list.every((c) => this.selectedContactPhones().has(c.phoneE164));
  }

  toggleSelectAll(): void {
    const list = this.contacts();
    const all = this.allSelected();
    this.selectedContactPhones.update((set) => {
      const next = new Set(set);
      for (const c of list) {
        if (all) next.delete(c.phoneE164);
        else next.add(c.phoneE164);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedContactPhones.set(new Set());
  }

  selectedContactsArray(): string[] {
    return Array.from(this.selectedContactPhones());
  }

  modalTargetCount(): number {
    return this.modalTargets().length;
  }

  openQuickModal(targets: string[], _contactName?: string): void {
    this.modalTargets.set(targets);
    this.modalError.set('');
    this.modalSuccess.set('');
    this.messageBody = '';
    this.attachedMedia.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onFileSelected(event: Event, expectedType: 'image' | 'video' | 'audio' | 'document'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const commaIndex = dataUrl.indexOf(',');
      const base64 = commaIndex !== -1 ? dataUrl.slice(commaIndex + 1) : dataUrl;

      this.attachedMedia.set({
        base64,
        dataUrl,
        fileName: file.name,
        fileSize: file.size,
        mimetype: file.type || 'application/octet-stream',
        type: expectedType,
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

  sendModalBroadcast(): void {
    this.modalError.set('');
    this.modalSuccess.set('');

    const body = this.messageBody.trim();
    const media = this.attachedMedia();

    if (!body && !media) {
      this.modalError.set('Please write a message or attach media.');
      return;
    }

    const recipients = this.modalTargets();
    if (recipients.length === 0) {
      this.modalError.set('No contacts selected.');
      return;
    }

    const payload: any = {
      recipients,
      body,
    };

    if (media) {
      payload.media = {
        base64: media.base64,
        fileName: media.fileName,
        mimetype: media.mimetype,
        type: media.type,
      };
    }

    this.modalSending.set(true);

    this.api.post<any>('messages/send', payload).subscribe({
      next: (res) => {
        this.modalSending.set(false);
        const data = res?.data || res;
        this.modalSuccess.set(`Delivered ${data.sent ?? recipients.length} message(s) successfully!`);
        setTimeout(() => {
          this.closeModal();
          this.clearSelection();
        }, 1500);
      },
      error: (err) => {
        this.modalSending.set(false);
        this.modalError.set(err?.error?.message || 'Failed to send message. Make sure WhatsApp is connected.');
      },
    });
  }

  goToFullComposer(): void {
    const phones = this.modalTargets().join(',');
    this.closeModal();
    this.router.navigate(['/messages/send'], {
      queryParams: { recipients: phones },
    });
  }

  loadNext(): void { this.currentCursor = this.nextCursor(); this.loadContacts(); }
  loadPrevious(): void { this.currentCursor = null; this.loadContacts(); }
}
