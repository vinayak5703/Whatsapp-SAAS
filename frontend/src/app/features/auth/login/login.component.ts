import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArrowRight, CheckCircle2, Lock, LucideAngularModule, MessageCircle, Radio, ShieldCheck, Sparkles, Users, Zap } from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
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
            Broadcast Faster.<br>
            <span class="gradient-text">Engage Smarter.</span>
          </h1>

          <p class="hero-subtext">
            Enterprise-grade WhatsApp marketing, multi-group broadcasting, and media-rich campaign automation — all in one unified workspace.
          </p>

          <!-- HIGHLIGHT TILES -->
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="Users" [size]="16" /></div>
              <div>
                <strong>Bulk Multi-Broadcast</strong>
                <p>Send to 10–20+ groups & contacts at once</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="Zap" [size]="16" /></div>
              <div>
                <strong>Audio, Video & PDF Media</strong>
                <p>Attach songs, documents, and clips up to 50MB</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon"><lucide-angular [img]="Radio" [size]="16" /></div>
              <div>
                <strong>Persistent Baileys Engine</strong>
                <p>Always connected with real-time socket syncing</p>
              </div>
            </div>
          </div>
        </div>

        <footer class="aside-footer">
          <div class="footer-meta">
            <span class="secure-badge"><lucide-angular [img]="ShieldCheck" [size]="14" /> Multi-Tenant Encrypted</span>
            <span>© 2026 MsgFlow Inc.</span>
          </div>
        </footer>
      </section>

      <!-- RIGHT SIGN IN FORM SECTION -->
      <section class="auth-main">
        <div class="auth-box-container">
          <div class="form-header">
            <span class="welcome-chip">Welcome back</span>
            <h2>Sign in to MsgFlow</h2>
            <p class="form-desc">Enter your business email and password to access your messaging dashboard.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="signIn()" class="signin-form">
            <div class="form-group">
              <label for="emailInput" class="form-label">Work Email Address</label>
              <div class="input-wrap">
                <input
                  id="emailInput"
                  class="styled-input"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="name@business.com"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="passwordInput" class="form-label">Account Password</label>
                <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
              </div>
              <div class="input-wrap">
                <input
                  id="passwordInput"
                  class="styled-input"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="Enter your secure password"
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
                <span>Signing in to MsgFlow…</span>
              } @else {
                <span>Sign in to Workspace</span>
                <lucide-angular [img]="ArrowRight" [size]="17" />
              }
            </button>
          </form>

          <div class="auth-footer-area">
            <p class="switch-prompt">
              New to MsgFlow? <a routerLink="/register" class="register-link">Create an account</a>
            </p>

            <div class="security-guarantee">
              <span class="pulse-green-dot"></span>
              <span>Protected with 256-bit tenant isolation & persistent WhatsApp Baileys engine</span>
            </div>
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
      padding: 40px 0;
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
      margin-bottom: 20px;
    }

    .hero-headline {
      font-family: 'Manrope', sans-serif;
      font-size: clamp(34px, 3.8vw, 50px);
      line-height: 1.12;
      font-weight: 800;
      margin: 0 0 18px;
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
      font-size: 14px;
      line-height: 1.7;
      margin: 0 0 32px;
      opacity: 0.9;
    }

    .feature-grid {
      display: grid;
      gap: 14px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px 16px;
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
      width: 34px;
      height: 34px;
      border-radius: 9px;
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
      padding-top: 20px;
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
      padding: 40px 30px;
      background: radial-gradient(circle at 80% 90%, #0f1c16 0%, #070e0a 100%);
    }

    .auth-box-container {
      width: min(100%, 420px);
      background: rgba(18, 30, 24, 0.85);
      border: 1px solid rgba(37, 211, 102, 0.18);
      border-radius: 20px;
      padding: 38px 34px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(16px);
      animation: form-enter 0.4s ease-out;
    }

    @keyframes form-enter {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-header {
      margin-bottom: 28px;
    }

    .welcome-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #25d366;
      margin-bottom: 8px;
    }

    .form-header h2 {
      font-family: 'Manrope', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }

    .form-desc {
      margin: 0;
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.55;
    }

    .signin-form {
      display: grid;
      gap: 18px;
    }

    .form-group {
      display: grid;
      gap: 8px;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .form-label {
      font-size: 12px;
      font-weight: 700;
      color: #e2e8f0;
    }

    .forgot-link {
      font-size: 11px;
      font-weight: 600;
      color: #34d399;
      transition: color 0.15s;
    }

    .forgot-link:hover {
      color: #6ee7b7;
      text-decoration: underline;
    }

    .input-wrap {
      position: relative;
    }

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
      height: 48px;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 6px;
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
      margin-top: 24px;
      text-align: center;
    }

    .switch-prompt {
      margin: 0 0 16px;
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

    .security-guarantee {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      color: #64748b;
      font-size: 10px;
      line-height: 1.4;
    }

    .pulse-green-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #25d366;
      box-shadow: 0 0 8px #25d366;
      flex-shrink: 0;
    }

    @media (max-width: 900px) {
      .auth-page {
        grid-template-columns: 1fr;
      }
      .auth-aside {
        min-height: auto;
        padding: 30px 24px;
      }
      .aside-copy {
        margin: 20px 0;
        padding: 0;
      }
      .hero-headline {
        font-size: 28px;
      }
      .feature-grid, .hero-subtext, .aside-footer {
        display: none;
      }
      .auth-main {
        padding: 32px 20px 48px;
      }
      .auth-box-container {
        padding: 28px 22px;
      }
    }
  `],
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly ArrowRight = ArrowRight;
  readonly MessageCircle = MessageCircle;
  readonly Sparkles = Sparkles;
  readonly Users = Users;
  readonly Zap = Zap;
  readonly Radio = Radio;
  readonly ShieldCheck = ShieldCheck;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  signIn(): void {
    this.error.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        let msg = 'Sign-in failed. Invalid email or password. Please verify credentials.';
        if (err && typeof err === 'object' && 'error' in err) {
          const apiErr = (err as { error?: { message?: string | string[] } }).error;
          if (apiErr?.message) {
            msg = Array.isArray(apiErr.message) ? apiErr.message.join('. ') : apiErr.message;
          }
        }
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
