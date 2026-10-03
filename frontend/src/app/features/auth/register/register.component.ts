import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowRight, CheckCircle2, LucideAngularModule, MessageCircle, Radio, ShieldCheck, Sparkles, Users, Zap } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <main class="auth-page">
      <!-- LEFT BRAND HERO SECTION -->
      <section class="auth-aside">
        <div class="aside-backdrop-glow"></div>
        <div class="aside-backdrop-circle"></div>

        <header class="aside-top">
          <a class="auth-brand" routerLink="/login">
            <div class="brand-icon-wrapper">
              <lucide-angular [img]="MessageCircle" [size]="22" />
              <div class="icon-pulse"></div>
            </div>
            <div class="brand-text-group">
              <span class="brand-title">Msg<span>Flow</span></span>
              <span class="brand-badge">PRO PLATFORM</span>
            </div>
          </a>
        </header>

        <div class="aside-copy">
          <div class="platform-chip">
            <lucide-angular [img]="Sparkles" [size]="14" />
            <span>Multi-Contact Messaging & Automation</span>
          </div>

          <h1 class="hero-headline">
            Start Your Free<br>
            <span class="gradient-text">Business Workspace.</span>
          </h1>

          <p class="hero-subtext">
            Join thousands of businesses streamlining multi-contact broadcasting, dynamic templates, media delivery, and real-time WhatsApp engagement.
          </p>

          <!-- HIGHLIGHT TILES -->
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="CheckCircle2" [size]="16" /></div>
              <div>
                <strong>Zero Setup Delay</strong>
                <p>Instant QR pairing with your WhatsApp business number</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="Zap" [size]="16" /></div>
              <div>
                <strong>Unlimited Multi-Broadcasting</strong>
                <p>Blast photos, songs, PDFs, and video messages effortlessly</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="ShieldCheck" [size]="16" /></div>
              <div>
                <strong>Isolated Multi-Tenant Security</strong>
                <p>Dedicated session persistence and data privacy</p>
              </div>
            </div>
          </div>
        </div>

        <footer class="aside-footer">
          <div class="footer-meta">
            <span class="secure-badge"><lucide-angular [img]="ShieldCheck" [size]="14" /> Enterprise TLS & JWT</span>
            <span>© 2026 MsgFlow Inc.</span>
          </div>
        </footer>
      </section>

      <!-- RIGHT REGISTER FORM SECTION -->
      <section class="auth-main">
        <div class="auth-box-container">
          <div class="form-header">
            <span class="welcome-chip">Get Started Free</span>
            <h2>Create your workspace</h2>
            <p class="form-desc">Set up your MsgFlow account to start sending messages in seconds.</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="createAccount()" class="signin-form">
            <div class="form-group">
              <label for="businessNameInput" class="form-label">Business / Workspace Name</label>
              <input
                id="businessNameInput"
                class="styled-input"
                formControlName="businessName"
                autocomplete="organization"
                placeholder="e.g. Acme Media Corp"
              />
            </div>

            <div class="name-grid">
              <div class="form-group">
                <label for="firstNameInput" class="form-label">First Name</label>
                <input
                  id="firstNameInput"
                  class="styled-input"
                  formControlName="firstName"
                  autocomplete="given-name"
                  placeholder="John"
                />
              </div>

              <div class="form-group">
                <label for="lastNameInput" class="form-label">Last Name</label>
                <input
                  id="lastNameInput"
                  class="styled-input"
                  formControlName="lastName"
                  autocomplete="family-name"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="regEmailInput" class="form-label">Work Email Address</label>
              <input
                id="regEmailInput"
                class="styled-input"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="name@business.com"
              />
            </div>

            <div class="form-group">
              <label for="regPasswordInput" class="form-label">Create Password</label>
              <input
                id="regPasswordInput"
                class="styled-input"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>

            @if (error()) {
              <div class="auth-alert" role="alert">
                <span class="alert-dot"></span>
                <span>{{ error() }}</span>
              </div>
            }

            <button class="primary-action-btn" type="submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
                <span>Creating your workspace…</span>
              } @else {
                <span>Create MsgFlow Workspace</span>
                <lucide-angular [img]="ArrowRight" [size]="17" />
              }
            </button>
          </form>

          <div class="auth-footer-area">
            <p class="switch-prompt">
              Already have an account? <a routerLink="/login" class="register-link">Sign in</a>
            </p>

            <p class="terms-text">
              By creating an account you agree to MsgFlow Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; }

    .auth-page {
      display: grid;
      min-height: 100vh;
      grid-template-columns: minmax(420px, 1.05fr) minmax(460px, 1.15fr);
      background: #09110d;
      font-family: 'DM Sans', sans-serif;
    }

    /* ---------------- LEFT HERO ASIDE ---------------- */
    .auth-aside {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: radial-gradient(circle at 20% 20%, #164e39 0%, #0c2d20 50%, #061710 100%);
      padding: 42px 6vw 34px;
      color: #ffffff;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .aside-backdrop-glow {
      position: absolute;
      top: -120px;
      left: -100px;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(37, 211, 102, 0.22) 0%, rgba(37, 211, 102, 0) 70%);
      filter: blur(50px);
      pointer-events: none;
    }

    .aside-backdrop-circle {
      position: absolute;
      right: -100px;
      bottom: -60px;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      border: 1px dashed rgba(37, 211, 102, 0.2);
      box-shadow: 0 0 80px rgba(37, 211, 102, 0.08);
      pointer-events: none;
    }

    .aside-top {
      z-index: 2;
    }

    .auth-brand {
      display: inline-flex;
      align-items: center;
      gap: 13px;
      text-decoration: none;
    }

    .brand-icon-wrapper {
      position: relative;
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
      color: #072217;
      box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
    }

    .icon-pulse {
      position: absolute;
      inset: -3px;
      border-radius: 14px;
      border: 1px solid rgba(37, 211, 102, 0.5);
      animation: brand-glow 2.5s infinite alternate;
    }

    @keyframes brand-glow {
      0% { opacity: 0.3; transform: scale(0.98); }
      100% { opacity: 0.9; transform: scale(1.05); }
    }

    .brand-text-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .brand-title {
      font-family: 'Manrope', sans-serif;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
    }

    .brand-title span {
      background: linear-gradient(90deg, #25d366 0%, #6ee7b7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-badge {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #34d399;
      background: rgba(52, 211, 153, 0.12);
      padding: 2px 7px;
      border-radius: 4px;
      width: fit-content;
      border: 1px solid rgba(52, 211, 153, 0.25);
    }

    .aside-copy {
      z-index: 2;
      margin: auto 0;
      padding: 30px 0;
      max-width: 480px;
    }

    .platform-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(37, 211, 102, 0.12);
      border: 1px solid rgba(37, 211, 102, 0.3);
      color: #6ee7b7;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 18px;
    }

    .hero-headline {
      font-family: 'Manrope', sans-serif;
      font-size: clamp(32px, 3.6vw, 46px);
      line-height: 1.12;
      font-weight: 800;
      margin: 0 0 16px;
      color: #ffffff;
      letter-spacing: -0.03em;
    }

    .gradient-text {
      background: linear-gradient(90deg, #25d366 0%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtext {
      color: #a7f3d0;
      font-size: 13px;
      line-height: 1.65;
      margin: 0 0 28px;
      opacity: 0.9;
    }

    .feature-grid {
      display: grid;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 13px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 11px 15px;
      backdrop-filter: blur(10px);
      transition: all 0.2s ease;
    }

    .feature-item:hover {
      background: rgba(37, 211, 102, 0.08);
      border-color: rgba(37, 211, 102, 0.3);
      transform: translateX(4px);
    }

    .feature-icon {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(37, 211, 102, 0.16);
      color: #25d366;
      flex-shrink: 0;
    }

    .feature-item strong {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 2px;
    }

    .feature-item p {
      margin: 0;
      font-size: 11px;
      color: #94a3b8;
    }

    .aside-footer {
      z-index: 2;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 18px;
    }

    .footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #64748b;
      font-size: 11px;
    }

    .secure-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #10b981;
      font-weight: 600;
    }

    /* ---------------- RIGHT MAIN FORM ---------------- */
    .auth-main {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 35px 30px;
      background: radial-gradient(circle at 80% 90%, #0f1c16 0%, #070e0a 100%);
    }

    .auth-box-container {
      width: min(100%, 460px);
      background: rgba(18, 30, 24, 0.85);
      border: 1px solid rgba(37, 211, 102, 0.18);
      border-radius: 20px;
      padding: 34px 32px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      animation: form-enter 0.4s ease-out;
    }

    @keyframes form-enter {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-header {
      margin-bottom: 22px;
    }

    .welcome-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #25d366;
      margin-bottom: 6px;
    }

    .form-header h2 {
      font-family: 'Manrope', sans-serif;
      font-size: 25px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }

    .form-desc {
      margin: 0;
      color: #94a3b8;
      font-size: 12px;
      line-height: 1.5;
    }

    .signin-form {
      display: grid;
      gap: 15px;
    }

    .name-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-group {
      display: grid;
      gap: 6px;
    }

    .form-label {
      font-size: 12px;
      font-weight: 700;
      color: #e2e8f0;
    }

    .styled-input {
      width: 100%;
      height: 44px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9px;
      background: rgba(10, 20, 15, 0.9);
      color: #ffffff;
      padding: 0 13px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s ease;
    }

    .styled-input::placeholder {
      color: #4b5563;
    }

    .styled-input:focus {
      border-color: #25d366;
      box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.2);
      background: rgba(12, 24, 18, 0.98);
    }

    .auth-alert {
      display: flex;
      align-items: center;
      gap: 9px;
      border: 1px solid rgba(248, 113, 113, 0.35);
      background: rgba(239, 68, 68, 0.12);
      border-radius: 8px;
      padding: 10px 14px;
      color: #fca5a5;
      font-size: 12px;
      font-weight: 600;
    }

    .alert-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #f87171;
      flex-shrink: 0;
    }

    .primary-action-btn {
      display: inline-flex;
      width: 100%;
      height: 46px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 4px;
      border: 0;
      border-radius: 10px;
      background: linear-gradient(135deg, #25d366 0%, #10b981 100%);
      color: #041f14;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(37, 211, 102, 0.35);
      transition: all 0.2s ease;
    }

    .primary-action-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(37, 211, 102, 0.45);
      background: linear-gradient(135deg, #2ae06f 0%, #13c78d 100%);
    }

    .primary-action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(4, 31, 20, 0.3);
      border-top-color: #041f14;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer-area {
      margin-top: 20px;
      text-align: center;
    }

    .switch-prompt {
      margin: 0 0 12px;
      color: #94a3b8;
      font-size: 12px;
    }

    .register-link {
      color: #25d366;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.15s;
    }

    .register-link:hover {
      color: #6ee7b7;
      text-decoration: underline;
    }

    .terms-text {
      color: #64748b;
      font-size: 10px;
      line-height: 1.4;
      margin: 0;
    }

    @media (max-width: 900px) {
      .auth-page {
        grid-template-columns: 1fr;
      }
      .auth-aside {
        min-height: auto;
        padding: 28px 22px;
      }
      .aside-copy {
        margin: 16px 0;
        padding: 0;
      }
      .hero-headline {
        font-size: 26px;
      }
      .feature-grid, .hero-subtext, .aside-footer {
        display: none;
      }
      .auth-main {
        padding: 28px 18px 44px;
      }
      .auth-box-container {
        padding: 26px 20px;
      }
      .name-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly ArrowRight = ArrowRight;
  readonly MessageCircle = MessageCircle;
  readonly Sparkles = Sparkles;
  readonly CheckCircle2 = CheckCircle2;
  readonly Zap = Zap;
  readonly ShieldCheck = ShieldCheck;

  readonly registerForm = this.formBuilder.nonNullable.group({
    businessName: ['', [Validators.required, Validators.maxLength(255)]],
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(128)]],
  });

  createAccount(): void {
    this.error.set('');
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.register(this.registerForm.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (error: unknown) => {
        this.error.set(this.getRegistrationError(error));
        this.loading.set(false);
      },
    });
  }

  private getRegistrationError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'हा ईमेल आधीच नोंदणीकृत आहे (This email is already registered). कृपया लॉगिन करा किंवा दुसरा ईमेल आयडी वापरा.';
      }
      const message = error.error?.message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join('. ');
      if (error.status === 0) return 'Cannot reach the Node API. Check that the backend is running.';
    }
    return 'Workspace could not be created. Check the form and try again.';
  }
}
