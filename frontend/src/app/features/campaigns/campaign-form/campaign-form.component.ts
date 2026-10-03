import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowLeft, CircleAlert, LucideAngularModule, Megaphone } from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading"><div><a class="back-link" routerLink="/campaigns"><lucide-angular [img]="ArrowLeft" [size]="15" />Back to campaigns</a><p class="eyebrow">Messaging</p><h1>Create campaign</h1><p class="page-subtitle">Prepare an asynchronous message campaign for your audience.</p></div></div>
      <form class="campaign-form surface" [formGroup]="campaignForm" (ngSubmit)="createCampaign()">
        <div class="form-title"><span class="form-icon"><lucide-angular [img]="Megaphone" [size]="19" /></span><div><h2>Campaign setup</h2><p>Campaigns are processed by background workers.</p></div></div>
        <div class="form-fields">
          <label class="field">Campaign name<input class="control" formControlName="name" maxlength="255" placeholder="For example, monthly update"></label>
          <label class="field">Message<textarea class="control" formControlName="message" maxlength="4096" placeholder="Write the message you want to send"></textarea><small>{{ campaignForm.controls.message.value.length }} / 4096</small></label>
          <label class="field">Schedule time <span class="optional">Optional</span><input class="control" type="datetime-local" formControlName="scheduledAt"><small>Leave blank to create this campaign as a draft.</small></label>
        </div>
        @if (error()) { <div class="form-error"><lucide-angular [img]="CircleAlert" [size]="16" />{{ error() }}</div> }
        <div class="form-actions"><a class="button button-secondary" routerLink="/campaigns">Cancel</a><button class="button button-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Creating…' : 'Save campaign' }}</button></div>
      </form>
    </section>
  `,
  styles: [`
    .back-link { display:flex; align-items:center; gap:6px; margin-bottom:19px; color:#647169; font-size:11px; font-weight:700; }
    .campaign-form { max-width:760px; padding:23px; }
    .form-title { display:flex; align-items:center; gap:12px; border-bottom:1px solid #e6eae4; padding-bottom:18px; }
    .form-icon { display:grid; width:39px; height:39px; place-items:center; border-radius:8px; background:#e6f2eb; color:#176b4a; }
    .form-title h2 { margin:0 0 4px; font-size:14px; }
    .form-title p { margin:0; color:#89938c; font-size:11px; }
    .form-fields { display:grid; gap:18px; padding:22px 0; }
    .form-fields small,.optional { color:#929b94; font-size:10px; font-weight:400; }
    .form-actions { display:flex; justify-content:flex-end; gap:9px; border-top:1px solid #e6eae4; padding-top:17px; }
    .form-error { display:flex; align-items:center; gap:8px; margin-bottom:13px; color:#a95443; font-size:12px; }
    @media(max-width:600px) { .campaign-form { padding:17px; } }
  `],
})
export class CampaignFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly ArrowLeft = ArrowLeft;
  readonly Megaphone = Megaphone;
  readonly CircleAlert = CircleAlert;

  readonly campaignForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    message: ['', [Validators.required, Validators.maxLength(4096)]],
    scheduledAt: [''],
  });

  createCampaign(): void {
    this.error.set('');
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const values = this.campaignForm.getRawValue();
    const payload = {
      name: values.name,
      message: values.message,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
    };
    this.api.post('campaigns', payload).subscribe({
      next: () => this.router.navigateByUrl('/campaigns'),
      error: () => {
        this.error.set('Campaign could not be created. Check the API connection and try again.');
        this.saving.set(false);
      },
    });
  }
}
