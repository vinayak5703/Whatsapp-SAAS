import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LucideAngularModule,
  Mail, MessageCircle, PhoneCall, ShieldCheck, Sparkles, User, Zap
} from 'lucide-angular';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <main class="auth-page">
      <!-- LEFT HERO ASIDE -->
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
              <span class="brand-badge">SECURE RECOVERY</span>
            </div>
          </a>
        </header>

        <div class="aside-copy">
          <div class="platform-chip">
            <lucide-angular [img]="KeyRound" [size]="14" />
            <span>Account Security & Access Recovery</span>
          </div>

          <h1 class="hero-headline">
            Recover Your<br>
            <span class="gradient-text">Workspace Access.</span>
          </h1>

          <p class="hero-subtext">
            Forgot your password? No worries. Request a reset link or connect directly with our technical support team to regain instant access.
          </p>

          <!-- HIGHLIGHT TILES -->
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="ShieldCheck" [size]="16" /></div>
              <div>
                <strong>Encrypted Tenant Security</strong>
                <p>Your workspace data remains completely safe and isolated</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="PhoneCall" [size]="16" /></div>
              <div>
                <strong>Instant Admin Support</strong>
                <p>Call or WhatsApp <strong>+91 7499415916</strong> (Vinayak Bhoskar)</p>
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

      <!-- RIGHT RESET FORM -->
      <section class="auth-main">
        <div class="auth-box-container">
          @if (!submitted()) {
            <!-- FORM STATE -->
            <div class="form-header">
              <span class="welcome-chip">Password Assistance</span>
              <h2>Reset your password</h2>
              <p class="form-desc">
                Enter your registered business email address and we will send you password reset instructions.
              </p>
            </div>

            <form [formGroup]="forgotForm" (ngSubmit)="submitRequest()" class="signin-form">
              <div class="form-group">
                <label for="resetEmail" class="form-label">Registered Work Email</label>
                <div class="input-wrap">
                  <input
                    id="resetEmail"
                    class="styled-input"
                    type="email"
                    formControlName="email"
                    autocomplete="email"
                    placeholder="name@business.com"
                  />
                </div>
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
                  <span>Processing request…</span>
                } @else {
                  <span>Send Reset Instructions</span>
                  <lucide-angular [img]="ArrowRight" [size]="17" />
                }
              </button>
            </form>

            <div class="auth-footer-area">
              <a routerLink="/login" class="back-link">
                <lucide-angular [img]="ArrowLeft" [size]="15" />
                <span>Back to Sign In</span>
              </a>
            </div>
          } @else {
            <!-- SUCCESS STATE -->
            <div class="success-box">
              <div class="success-icon-wrap">
                <lucide-angular [img]="CheckCircle2" [size]="36" />
              </div>

              <h2>Reset Request Received!</h2>
              <p class="success-desc">
                Password recovery request for <strong>{{ forgotForm.getRawValue().email }}</strong> has been recorded.
              </p>

              <!-- DIRECT EXECUTIVE CARD -->
              <div class="admin-direct-card">
                <div class="card-header-small">
                  <lucide-angular [img]="Sparkles" [size]="14" />
                  <span>Instant Reset via Support Lead</span>
                </div>
                <div class="admin-body">
                  <strong>विनायक भोसकर (Vinayak Bhoskar)</strong>
                  <p>तातडीने पासवर्ड रिसेट करण्यासाठी खालील WhatsApp बटण किंवा कॉलवर संपर्क करा:</p>
                  
                  <div class="admin-actions">
                    <a
                      [href]="'https://wa.me/917499415916?text=Hello%20Vinayak%2C%20please%20reset%20my%20MsgFlow%20password%20for%20email%3A%20' + forgotForm.getRawValue().email"
                      target="_blank"
                      class="button wa-direct-btn"
                    >
                      <lucide-angular [img]="MessageCircle" [size]="16" />
                      <span>WhatsApp Vinayak (+91 7499415916)</span>
                    </a>

                    <a href="tel:+917499415916" class="button phone-direct-btn">
                      <lucide-angular [img]="PhoneCall" [size]="15" />
                      <span>Direct Call</span>
                    </a>
                  </div>
                </div>
              </div>

              <div class="success-footer">
                <a routerLink="/login" class="primary-action-btn back-login-btn">
                  <lucide-angular [img]="ArrowLeft" [size]="16" />
                  <span>Return to Sign In</span>
                </a>
              </div>
            </div>
          }
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

    .aside-top { z-index: 2; }

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

    .brand-text-group { display: flex; flex-direction: column; gap: 2px; }

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

    .feature-grid { display: grid; gap: 12px; }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 13px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 11px 15px;
      backdrop-filter: blur(10px);
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

    .feature-item strong { display: block; font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 2px; }
    .feature-item p { margin: 0; font-size: 11px; color: #94a3b8; }

    .aside-footer {
      z-index: 2;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 18px;
    }

    .footer-meta { display: flex; justify-content: space-between; align-items: center; color: #64748b; font-size: 11px; }
    .secure-badge { display: inline-flex; align-items: center; gap: 6px; color: #10b981; font-weight: 600; }

    /* ---------------- RIGHT FORM ---------------- */
    .auth-main {
      display: grid;
      place-items: center;
      min-height: 100vh;
      padding: 40px 30px;
      background: radial-gradient(circle at 80% 90%, #0f1c16 0%, #070e0a 100%);
    }

    .auth-box-container {
      width: min(100%, 440px);
      background: rgba(18, 30, 24, 0.85);
      border: 1px solid rgba(37, 211, 102, 0.18);
      border-radius: 20px;
      padding: 36px 32px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      animation: form-enter 0.4s ease-out;
    }

    @keyframes form-enter {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-header { margin-bottom: 24px; }
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

    .form-desc { margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.55; }
    .signin-form { display: grid; gap: 18px; }
    .form-group { display: grid; gap: 8px; }
    .form-label { font-size: 12px; font-weight: 700; color: #e2e8f0; }

    .styled-input {
      width: 100%;
      height: 46px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9px;
      background: rgba(10, 20, 15, 0.9);
      color: #ffffff;
      padding: 0 14px;
      font-size: 13px;
      outline: none;
      transition: all 0.2s ease;
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

    .alert-dot { width: 7px; height: 7px; border-radius: 50%; background: #f87171; }

    .primary-action-btn {
      display: inline-flex;
      width: 100%;
      height: 48px;
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
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(4, 31, 20, 0.3);
      border-top-color: #041f14;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-footer-area { margin-top: 22px; text-align: center; }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.15s;
    }

    .back-link:hover { color: #25d366; }

    /* ---------------- SUCCESS STATE ---------------- */
    .success-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .success-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(37, 211, 102, 0.18);
      color: #25d366;
      display: grid;
      place-items: center;
      border: 1px solid rgba(37, 211, 102, 0.3);
      box-shadow: 0 0 20px rgba(37, 211, 102, 0.2);
    }

    .success-box h2 {
      font-size: 22px;
      color: #ffffff;
      margin: 0;
    }

    .success-desc {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.55;
      margin: 0;
    }

    .success-desc strong { color: #ffffff; }

    .admin-direct-card {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(37, 211, 102, 0.25);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      margin-top: 6px;
    }

    .card-header-small {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 800;
      color: #25d366;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
    }

    .admin-body strong {
      color: #ffffff;
      font-size: 14px;
      display: block;
      margin-bottom: 4px;
    }

    .admin-body p {
      color: #cbd5e1;
      font-size: 12px;
      line-height: 1.5;
      margin: 0 0 12px;
    }

    .admin-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .wa-direct-btn {
      width: 100%;
      height: 40px;
      background: #25d366;
      color: #041f14;
      font-weight: 800;
      font-size: 12px;
      border-radius: 8px;
    }

    .wa-direct-btn:hover {
      box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
    }

    .phone-direct-btn {
      width: 100%;
      height: 36px;
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      border-radius: 8px;
    }

    .success-footer { width: 100%; margin-top: 8px; }
    .back-login-btn { text-decoration: none; }

    @media (max-width: 900px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-aside { display: none; }
      .auth-main { padding: 32px 20px; }
    }
  `],
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly error = signal('');

  readonly ArrowRight = ArrowRight;
  readonly ArrowLeft = ArrowLeft;
  readonly MessageCircle = MessageCircle;
  readonly KeyRound = KeyRound;
  readonly ShieldCheck = ShieldCheck;
  readonly PhoneCall = PhoneCall;
  readonly CheckCircle2 = CheckCircle2;
  readonly Sparkles = Sparkles;

  readonly forgotForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submitRequest(): void {
    this.error.set('');
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    // Simulate instantaneous verification & record
    setTimeout(() => {
      this.loading.set(false);
      this.submitted.set(true);
    }, 600);
  }
}
