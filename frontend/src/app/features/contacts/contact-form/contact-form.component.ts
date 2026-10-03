import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowLeft, CircleAlert, ContactRound, LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <section class="page page-enter">
      <div class="page-heading">
        <div><a class="back-link" routerLink="/contacts"><lucide-angular [img]="ArrowLeft" [size]="15" />Back to contacts</a><p class="eyebrow">Address book</p><h1>Add a contact</h1><p class="page-subtitle">Save a person to your business contacts.</p></div>
      </div>
      <form class="contact-form surface" [formGroup]="contactForm" (ngSubmit)="saveContact()">
        <div class="form-title"><span class="form-icon"><lucide-angular [img]="ContactRound" [size]="19" /></span><div><h2>Contact details</h2><p>Contact data is stored in your workspace.</p></div></div>
        <div class="form-grid">
          <label class="field">First name<input class="control" formControlName="firstName" maxlength="120" autocomplete="given-name" placeholder="First name"></label>
          <label class="field">Last name<input class="control" formControlName="lastName" maxlength="120" autocomplete="family-name" placeholder="Last name"></label>
          <label class="field">Mobile number<input class="control" formControlName="phoneE164" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="+14155550123"><small>Use the full country code, for example +1.</small></label>
          <label class="field">Email address<input class="control" formControlName="email" maxlength="255" type="email" autocomplete="email" placeholder="name@company.com"></label>
          <label class="field full-field">Company<input class="control" formControlName="company" maxlength="255" placeholder="Company name"></label>
          <label class="field full-field">Notes<textarea class="control notes" formControlName="notes" maxlength="2000" placeholder="Add useful context about this contact"></textarea></label>
        </div>
        @if (error()) { <div class="form-error"><lucide-angular [img]="CircleAlert" [size]="16" />{{ error() }}</div> }
        <div class="form-actions"><a class="button button-secondary" routerLink="/contacts">Cancel</a><button class="button button-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save contact' }}</button></div>
      </form>
    </section>
  `,
  styles: [`
    .back-link { display:flex; align-items:center; gap:6px; margin-bottom:19px; color:#647169; font-size:11px; font-weight:700; }
    .contact-form { max-width:790px; padding:23px; }
    .form-title { display:flex; align-items:center; gap:12px; padding-bottom:19px; border-bottom:1px solid #e6eae4; }
    .form-icon { display:grid; width:39px; height:39px; place-items:center; border-radius:8px; background:#e6f2eb; color:#176b4a; }
    .form-title h2 { margin:0 0 4px; font-size:14px; }
    .form-title p { margin:0; color:#89938c; font-size:11px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px 15px; padding:23px 0; }
    .field small { color:#929b94; font-size:10px; font-weight:400; }
    .full-field { grid-column:1/-1; }
    .notes { min-height:95px!important; }
    .form-actions { display:flex; justify-content:flex-end; gap:9px; border-top:1px solid #e6eae4; padding-top:17px; }
    .form-error { display:flex; align-items:center; gap:8px; margin:0 0 14px; color:#a95443; font-size:12px; }
    @media(max-width:600px) { .contact-form { padding:17px; } .form-grid { grid-template-columns:1fr; gap:14px; padding:18px 0; } .full-field { grid-column:auto; } }
  `],
})
export class ContactFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly ArrowLeft = ArrowLeft;
  readonly ContactRound = ContactRound;
  readonly CircleAlert = CircleAlert;

  readonly contactForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    phoneE164: ['', [Validators.required, Validators.pattern(/^\\+[1-9]\\d{7,14}$/)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    company: ['', [Validators.maxLength(255)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  saveContact(): void {
    this.error.set('');
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.api.post('contacts', this.contactForm.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/contacts'),
      error: () => {
        this.error.set('Contact could not be saved. Check the API connection and try again.');
        this.saving.set(false);
      },
    });
  }
}
