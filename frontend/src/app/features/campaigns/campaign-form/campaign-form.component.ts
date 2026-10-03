import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ArrowLeft, CheckCircle2, CircleAlert, FileImage, FileText,
  LucideAngularModule, Megaphone, Music, Plus, Send, Users, Video, X
} from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div>
          <a class="back-link" routerLink="/campaigns">
            <lucide-angular [img]="ArrowLeft" [size]="15" />Back to campaigns
          </a>
          <p class="eyebrow">Outreach & Automation</p>
          <h1>Create WhatsApp Campaign</h1>
          <p class="page-subtitle">Configure automated multi-contact broadcast campaigns with personalized tags and media.</p>
        </div>
      </div>

      <form class="campaign-form surface" [formGroup]="campaignForm" (ngSubmit)="createCampaign()">
        <div class="form-title">
          <span class="form-icon"><lucide-angular [img]="Megaphone" [size]="20" /></span>
          <div>
            <h2>Campaign Setup & Dispatch</h2>
            <p>Campaigns are processed asynchronously with delivery reporting</p>
          </div>
        </div>

        <div class="form-fields">
          <div class="form-group">
            <label class="field-label">Campaign Name *</label>
            <input
              class="control"
              formControlName="name"
              maxlength="255"
              placeholder="e.g. Festival Special Offer Broadcast"
            />
          </div>

          <div class="form-group">
            <label class="field-label">Message Content *</label>
            <div class="template-tags-row">
              <span class="tag-hint">Click to insert tags:</span>
              <button type="button" class="tag-btn" (click)="insertTag('{{name}}')">+ Name</button>
              <button type="button" class="tag-btn" (click)="insertTag('{{firstName}}')">+ First Name</button>
            </div>
            <textarea
              class="control text-area-input"
              formControlName="message"
              maxlength="4096"
              rows="5"
              [placeholder]="'Write your broadcast message here... e.g. Hello {{name}}, check out our latest offers!'"
            ></textarea>
            <div class="char-counter">{{ campaignForm.controls.message.value.length }} / 4096 characters</div>
          </div>

          <!-- 4 SEPARATE MEDIA ATTACHMENT TILES -->
          <div class="form-group">
            <label class="field-label">Attach Media (Optional: 50MB Max)</label>
            <div class="media-tiles-grid">
              <label class="media-tile" [class.media-selected]="mediaType() === 'image'">
                <input type="file" accept="image/*" (change)="onFileSelected($event, 'image')" class="hidden-input">
                <lucide-angular [img]="FileImage" [size]="20" />
                <span>Photos / Image</span>
              </label>

              <label class="media-tile" [class.media-selected]="mediaType() === 'document'">
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" (change)="onFileSelected($event, 'document')" class="hidden-input">
                <lucide-angular [img]="FileText" [size]="20" />
                <span>PDF / Document</span>
              </label>

              <label class="media-tile" [class.media-selected]="mediaType() === 'audio'">
                <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a" (change)="onFileSelected($event, 'audio')" class="hidden-input">
                <lucide-angular [img]="Music" [size]="20" />
                <span>Songs / Audio</span>
              </label>

              <label class="media-tile" [class.media-selected]="mediaType() === 'video'">
                <input type="file" accept="video/*,.mp4,.mkv,.mov" (change)="onFileSelected($event, 'video')" class="hidden-input">
                <lucide-angular [img]="Video" [size]="20" />
                <span>Video Clip</span>
              </label>
            </div>

            @if (attachedFile()) {
              <div class="attached-file-pill">
                <span class="file-name">📎 {{ attachedFile()?.fileName }} ({{ attachedFile()?.type }})</span>
                <button type="button" class="remove-file-btn" (click)="clearMedia()">
                  <lucide-angular [img]="X" [size]="14" />
                </button>
              </div>
            }
          </div>

          <!-- SCHEDULE TIME -->
          <div class="form-group">
            <label class="field-label">Schedule Dispatch Time (Optional)</label>
            <input class="control" type="datetime-local" formControlName="scheduledAt">
            <small class="help-text">Leave blank to create this campaign ready for immediate start.</small>
          </div>
        </div>

        @if (error()) {
          <div class="form-error">
            <lucide-angular [img]="CircleAlert" [size]="16" />
            <span>{{ error() }}</span>
          </div>
        }

        <div class="form-actions">
          <a class="button button-secondary" routerLink="/campaigns">Cancel</a>
          <button class="button button-primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save & Prepare Campaign' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 16px; color: var(--ink-soft); font-size: 11px; font-weight: 700; text-decoration: none; }
    .back-link:hover { color: var(--green); }
    .campaign-form { max-width: 780px; padding: 28px 32px; border-radius: 14px; }
    .form-title { display: flex; align-items: center; gap: 14px; border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 22px; }
    .form-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 10px; background: var(--green-wash); color: var(--green); }
    .form-title h2 { margin: 0 0 3px; font-size: 16px; font-weight: 800; color: var(--ink); }
    .form-title p { margin: 0; color: var(--ink-faint); font-size: 11px; }

    .form-fields { display: grid; gap: 18px; }
    .form-group { display: grid; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 700; color: var(--ink); }
    
    .template-tags-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .tag-hint { font-size: 11px; color: var(--ink-faint); }
    .tag-btn { background: var(--surface-muted); border: 1px solid var(--line); border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 700; color: var(--green); cursor: pointer; }
    .tag-btn:hover { background: var(--green-wash); }
    
    .text-area-input { resize: vertical; min-height: 110px; font-family: inherit; line-height: 1.5; }
    .char-counter { font-size: 10px; color: var(--ink-faint); text-align: right; }

    .media-tiles-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 4px; }
    .media-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 8px;
      border: 1px dashed var(--line);
      border-radius: 9px;
      background: var(--surface-muted);
      cursor: pointer;
      color: var(--ink-soft);
      font-size: 11px;
      font-weight: 700;
      transition: all 0.18s;
      text-align: center;
    }
    .media-tile:hover { border-color: var(--green); color: var(--green); background: var(--surface-hover); }
    .media-selected { border-color: var(--green) !important; background: var(--green-wash) !important; color: var(--green) !important; border-style: solid !important; }
    .hidden-input { display: none; }

    .attached-file-pill {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 12px;
      border-radius: 6px;
      background: var(--green-wash);
      border: 1px solid rgba(37, 211, 102, 0.3);
      color: var(--green);
      font-size: 12px;
      font-weight: 700;
      margin-top: 8px;
      width: fit-content;
    }
    .remove-file-btn { border: 0; background: transparent; color: var(--coral); cursor: pointer; display: grid; place-items: center; }

    .help-text { font-size: 10px; color: var(--ink-faint); }
    .form-error { display: flex; align-items: center; gap: 8px; margin-top: 14px; color: var(--coral); font-size: 12px; font-weight: 700; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--line); padding-top: 20px; margin-top: 10px; }

    @media (max-width: 600px) {
      .media-tiles-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .campaign-form { padding: 18px; }
    }
  `],
})
export class CampaignFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly mediaType = signal<'image' | 'audio' | 'video' | 'document' | null>(null);
  readonly attachedFile = signal<{ fileName: string; type: string; base64: string } | null>(null);

  readonly ArrowLeft = ArrowLeft;
  readonly Megaphone = Megaphone;
  readonly CircleAlert = CircleAlert;
  readonly FileImage = FileImage;
  readonly FileText = FileText;
  readonly Music = Music;
  readonly Video = Video;
  readonly X = X;

  readonly campaignForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    message: ['', [Validators.required, Validators.maxLength(4096)]],
    scheduledAt: [''],
  });

  insertTag(tag: string): void {
    const current = this.campaignForm.controls.message.value;
    this.campaignForm.controls.message.setValue(current ? `${current} ${tag}` : tag);
  }

  onFileSelected(event: Event, type: 'image' | 'audio' | 'video' | 'document'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.mediaType.set(type);
      this.attachedFile.set({
        fileName: file.name,
        type: type,
        base64: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  }

  clearMedia(): void {
    this.mediaType.set(null);
    this.attachedFile.set(null);
  }

  createCampaign(): void {
    this.error.set('');
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const values = this.campaignForm.getRawValue();
    const media = this.attachedFile();

    const payload = {
      name: values.name,
      message: values.message,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
      media: media ? { base64: media.base64, fileName: media.fileName, type: media.type } : undefined,
    };

    this.api.post('campaigns', payload).subscribe({
      next: () => this.router.navigateByUrl('/campaigns'),
      error: () => {
        this.error.set('Campaign could not be created. Check connection and try again.');
        this.saving.set(false);
      },
    });
  }
}
