import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  Activity, BarChart3, ChevronDown, CircleHelp, ContactRound, FileImage, LayoutDashboard,
  LogOut, Menu, MessageCircle, Radio, Search, Send, Settings, Sparkles, UsersRound, X,
} from 'lucide-angular';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideAngularModule,
  ],
  template: `
    <div class="workspace">
      <!-- MOBILE MENU BUTTON -->
      <button class="mobile-menu" type="button" (click)="toggleMenu()" aria-label="Toggle navigation">
        @if (menuOpen()) { <lucide-angular [img]="X" [size]="20" /> }
        @else { <lucide-angular [img]="Menu" [size]="20" /> }
      </button>

      @if (menuOpen()) { <button class="mobile-scrim" type="button" (click)="closeMenu()" aria-label="Close navigation"></button> }

      <!-- SIDEBAR NAVIGATION -->
      <aside class="sidebar" [class.sidebar-open]="menuOpen()">
        <!-- BRAND LOGO -->
        <a class="brand" routerLink="/dashboard" (click)="closeMenu()">
          <div class="brand-icon-box">
            <lucide-angular [img]="MessageCircle" [size]="20" />
            <span class="icon-ambient-ring"></span>
          </div>
          <div class="brand-details">
            <span class="brand-name">Msg<span>Flow</span></span>
            <span class="brand-tagline">Multi-Contact & Automation</span>
          </div>
        </a>

        <!-- WORKSPACE CARD -->
        <div class="workspace-switcher">
          <span class="workspace-avatar">{{ initials() }}</span>
          <span class="workspace-copy">
            <strong>{{ workspaceName() }}</strong>
            <small><span class="live-dot"></span>Enterprise Workspace</small>
          </span>
          <lucide-angular [img]="ChevronDown" [size]="14" class="chevron-icon" />
        </div>

        <!-- MAIN NAV LINKS -->
        <nav class="navigation" aria-label="Main navigation">
          <p class="nav-label">Core Automation</p>
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="LayoutDashboard" [size]="18" /><span>Dashboard</span>
          </a>
          <a class="nav-link highlight-link" routerLink="/messages/send" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="Send" [size]="18" /><span>Send Broadcast</span>
            <span class="badge-new">PRO</span>
          </a>
          <a class="nav-link" routerLink="/campaigns" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="MessageCircle" [size]="18" /><span>Campaigns</span>
          </a>
          <a class="nav-link" routerLink="/contacts" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="ContactRound" [size]="18" /><span>Contacts</span>
          </a>
          <a class="nav-link" routerLink="/groups" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="UsersRound" [size]="18" /><span>Groups</span>
          </a>
          <a class="nav-link" routerLink="/media" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="FileImage" [size]="18" /><span>Media Library</span>
          </a>

          <p class="nav-label nav-label-spaced">Intelligence & Logs</p>
          <a class="nav-link" routerLink="/reports" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="BarChart3" [size]="18" /><span>Reports & Volume</span>
          </a>
          <a class="nav-link" routerLink="/logs" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="Activity" [size]="18" /><span>Activity Logs</span>
          </a>

          <p class="nav-label nav-label-spaced">Channels & Engine</p>
          <a class="nav-link whatsapp-nav-item" routerLink="/whatsapp" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="Radio" [size]="18" /><span>WhatsApp Channel</span>
            <span class="nav-indicator-pulse"></span>
          </a>
          <a class="nav-link" routerLink="/settings" routerLinkActive="nav-active" (click)="closeMenu()">
            <lucide-angular [img]="Settings" [size]="18" /><span>Settings</span>
          </a>
        </nav>

        <!-- SIDEBAR BOTTOM -->
        <div class="sidebar-bottom">
          <!-- DAY / NIGHT TOGGLE -->
          <div class="theme-switch-row">
            <span class="theme-label">Theme Appearance</span>
            <button
              type="button"
              class="theme-toggle-compact"
              (click)="themeService.toggleTheme()"
              [title]="themeService.isDark() ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'"
            >
              @if (themeService.isDark()) {
                <span class="theme-icon">🌙 Night</span>
              } @else {
                <span class="theme-icon">☀️ Day</span>
              }
            </button>
          </div>

          <a class="help-link" routerLink="/help"><lucide-angular [img]="CircleHelp" [size]="16" /><span>Help & Customer Support Center</span></a>

          <!-- USER INFO & LOGOUT -->
          <div class="user-card">
            <span class="user-avatar">{{ initials() }}</span>
            <span class="user-copy">
              <strong>{{ userName() }}</strong>
              <small>{{ auth.currentUser()?.email || 'Logged In' }}</small>
            </span>
            <button class="icon-button" type="button" aria-label="Sign out" title="Sign out" (click)="signOut()">
              <lucide-angular [img]="LogOut" [size]="16" />
            </button>
          </div>
        </div>
      </aside>

      <!-- MAIN AREA -->
      <main class="main-area">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="breadcrumbs">
            <span class="platform-name">MsgFlow</span>
            <span class="crumb-slash">/</span>
            <strong class="crumb-active">{{ pageTitle() }}</strong>
          </div>

          <div class="topbar-actions">
            <label class="global-search">
              <lucide-angular [img]="Search" [size]="16" />
              <input aria-label="Search MsgFlow workspace" placeholder="Search contacts, groups, logs...">
              <kbd>Ctrl K</kbd>
            </label>
            
            <!-- TOPBAR DAY/NIGHT SWITCHER -->
            <button
              class="theme-toggle-topbar"
              type="button"
              (click)="themeService.toggleTheme()"
              [title]="themeService.isDark() ? 'Switch to Day Mode' : 'Switch to Night Mode'"
              aria-label="Toggle Day and Night mode"
            >
              @if (themeService.isDark()) {
                <span class="mode-glyph">🌙</span>
                <span class="mode-text">Night</span>
              } @else {
                <span class="mode-glyph">☀️</span>
                <span class="mode-text">Day</span>
              }
            </button>

            <!-- AVATAR PILL -->
            <button class="top-avatar" type="button" aria-label="Account">{{ initials() }}</button>
          </div>
        </header>

        <div class="route-content">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; }
    .workspace { min-height:100vh; background:var(--canvas); }
    
    /* ---------------- SIDEBAR ---------------- */
    .sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 20;
      display: flex;
      width: 260px;
      flex-direction: column;
      border-right: 1px solid var(--line);
      background: var(--sidebar-bg);
      padding: 20px 14px 14px;
      transition: background-color 0.25s ease, border-color 0.25s ease;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px 20px;
      text-decoration: none;
    }

    .brand-icon-box {
      position: relative;
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #25d366 0%, #10b981 100%);
      color: #032014;
      box-shadow: 0 6px 18px rgba(37, 211, 102, 0.35);
      flex-shrink: 0;
    }

    .icon-ambient-ring {
      position: absolute;
      inset: -2px;
      border-radius: 12px;
      border: 1px solid rgba(37, 211, 102, 0.4);
    }

    .brand-details {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .brand-name {
      font-family: 'Manrope', sans-serif;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--ink);
    }

    .brand-name span {
      background: linear-gradient(90deg, #25d366 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-tagline {
      font-size: 9px;
      font-weight: 700;
      color: var(--ink-faint);
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .workspace-switcher {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 10px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      color: var(--ink-soft);
      background: var(--surface);
      margin-bottom: 6px;
      transition: all 0.2s;
    }

    .workspace-switcher:hover {
      border-color: var(--green);
      background: var(--surface-muted);
    }

    .workspace-avatar, .user-avatar, .top-avatar {
      display: grid;
      flex: none;
      place-items: center;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(37, 211, 102, 0.18) 0%, rgba(16, 185, 129, 0.28) 100%);
      color: var(--green);
      font-size: 11px;
      font-weight: 800;
      border: 1px solid rgba(37, 211, 102, 0.25);
    }

    .workspace-avatar { width: 32px; height: 32px; }
    .workspace-copy, .user-copy { display: grid; min-width: 0; flex: 1; gap: 2px; }
    .workspace-copy strong, .user-copy strong { overflow: hidden; color: var(--ink); font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
    .workspace-copy small, .user-copy small { display: flex; align-items: center; gap: 5px; overflow: hidden; color: var(--ink-faint); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    
    .live-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #25d366;
      box-shadow: 0 0 6px #25d366;
      flex-shrink: 0;
    }

    .chevron-icon { color: var(--ink-faint); }

    .navigation {
      overflow-y: auto;
      flex: 1;
      padding-top: 14px;
      padding-bottom: 10px;
      scrollbar-width: thin;
    }

    .nav-label {
      margin: 0 10px 8px;
      color: var(--ink-faint);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .09em;
      text-transform: uppercase;
    }

    .nav-label-spaced { margin-top: 20px; }

    .nav-link {
      position: relative;
      display: flex;
      min-height: 38px;
      align-items: center;
      gap: 11px;
      border-radius: 8px;
      padding: 0 11px;
      color: var(--ink-soft);
      font-size: 12px;
      font-weight: 600;
      transition: all .16s ease;
      margin-bottom: 2px;
    }

    .nav-link:hover {
      background: var(--surface-muted);
      color: var(--ink);
      transform: translateX(2px);
    }

    .nav-active {
      background: var(--green-wash) !important;
      color: var(--green) !important;
      font-weight: 700;
    }

    .badge-new {
      margin-left: auto;
      font-size: 9px;
      font-weight: 800;
      background: rgba(37, 211, 102, 0.16);
      color: var(--green);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(37, 211, 102, 0.25);
    }

    .nav-indicator-pulse {
      width: 7px;
      height: 7px;
      margin-left: auto;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      animation: indicator-pulse 2s infinite;
    }

    @keyframes indicator-pulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    .sidebar-bottom {
      border-top: 1px solid var(--line);
      padding-top: 12px;
      display: grid;
      gap: 8px;
    }

    .theme-switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 8px;
    }

    .theme-label {
      font-size: 11px;
      color: var(--ink-soft);
      font-weight: 600;
    }

    .theme-toggle-compact {
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }

    .theme-toggle-compact:hover {
      border-color: var(--green);
      background: var(--surface-muted);
      transform: scale(1.03);
    }

    .help-link {
      display: flex;
      height: 34px;
      align-items: center;
      gap: 9px;
      padding: 0 9px;
      color: var(--ink-soft);
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .help-link:hover {
      color: var(--green);
      background: var(--surface-muted);
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 9px;
      border-radius: 9px;
      background: var(--surface-muted);
      padding: 8px 10px;
      border: 1px solid var(--line);
    }

    .user-avatar { width: 32px; height: 32px; border-radius: 50%; }

    .icon-button {
      display: grid;
      width: 30px;
      height: 30px;
      flex: none;
      place-items: center;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--ink-soft);
      cursor: pointer;
      transition: all 0.15s;
    }

    .icon-button:hover {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }

    /* ---------------- MAIN & TOPBAR ---------------- */
    .main-area {
      min-height: 100vh;
      margin-left: 260px;
      background: var(--canvas);
      transition: margin-left 0.25s ease;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      height: 64px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--line);
      background: var(--topbar-bg);
      padding: 0 36px;
      backdrop-filter: blur(14px);
      transition: background-color 0.25s, border-color 0.25s;
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 9px;
      color: var(--ink-faint);
      font-size: 13px;
    }

    .platform-name {
      font-weight: 700;
      color: var(--green);
    }

    .crumb-slash {
      color: var(--line);
    }

    .crumb-active {
      color: var(--ink);
      font-weight: 700;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .global-search {
      display: flex;
      width: 260px;
      height: 36px;
      align-items: center;
      gap: 9px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 10px;
      color: var(--ink-soft);
      background: var(--surface);
      transition: all 0.2s ease;
    }

    .global-search:focus-within {
      border-color: var(--green);
      box-shadow: 0 0 0 3px var(--green-wash);
    }

    .global-search input {
      width: 100%;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--ink);
      font-size: 12px;
    }

    .global-search kbd {
      flex: none;
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 2px 5px;
      color: var(--ink-faint);
      font-family: inherit;
      font-size: 10px;
      font-weight: 700;
      background: var(--surface-muted);
    }

    .theme-toggle-topbar {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 13px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: var(--surface);
      color: var(--ink);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .theme-toggle-topbar:hover {
      border-color: var(--green);
      background: var(--surface-muted);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .top-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
    }

    .route-content {
      min-height: calc(100vh - 64px);
    }

    .mobile-menu, .mobile-scrim { display: none; }

    @media (max-width: 900px) {
      .sidebar { width: 230px; }
      .main-area { margin-left: 230px; }
      .topbar { padding: 0 20px; }
    }

    @media (max-width: 680px) {
      .sidebar {
        z-index: 40;
        width: min(290px, 86vw);
        transform: translateX(-102%);
        transition: transform .22s ease;
      }
      .sidebar-open { transform: translateX(0); }
      .main-area { margin-left: 0; }
      .topbar { height: 58px; padding: 0 14px 0 56px; }
      .global-search { width: 36px; justify-content: center; border-color: transparent; padding: 0; }
      .global-search input, .global-search kbd { display: none; }
      .topbar-actions { gap: 8px; }
      .mobile-menu {
        position: fixed;
        z-index: 50;
        top: 11px;
        left: 12px;
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 7px;
        background: var(--surface);
        color: var(--ink);
      }
      .mobile-scrim {
        position: fixed;
        z-index: 30;
        inset: 0;
        display: block;
        border: 0;
        background: rgba(0, 0, 0, 0.55);
      }
    }
  `],
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly menuOpen = signal(false);

  readonly Menu = Menu;
  readonly X = X;
  readonly Activity = Activity;
  readonly BarChart3 = BarChart3;
  readonly ChevronDown = ChevronDown;
  readonly CircleHelp = CircleHelp;
  readonly ContactRound = ContactRound;
  readonly FileImage = FileImage;
  readonly LayoutDashboard = LayoutDashboard;
  readonly LogOut = LogOut;
  readonly MessageCircle = MessageCircle;
  readonly Radio = Radio;
  readonly Search = Search;
  readonly Send = Send;
  readonly Settings = Settings;
  readonly UsersRound = UsersRound;
  readonly Sparkles = Sparkles;

  readonly pageTitle = signal(this.titleFromPath());
  readonly workspaceName = signal('MsgFlow Workspace');
  readonly userName = signal('Workspace Account');
  readonly initials = signal('MF');

  private readonly router = inject(Router);

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.workspaceName.set(`${user.firstName}'s workspace`);
      this.userName.set(`${user.firstName} ${user.lastName}`.trim());
      this.initials.set(`${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase() || 'MF');
    }
    this.router.events.subscribe(() => this.pageTitle.set(this.titleFromPath()));
  }

  toggleMenu(): void { this.menuOpen.update((isOpen) => !isOpen); }
  closeMenu(): void { this.menuOpen.set(false); }

  signOut(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.clearSession();
        window.location.href = '/login';
      },
      error: () => {
        this.auth.clearSession();
        window.location.href = '/login';
      },
    });
  }

  private titleFromPath(): string {
    const path = this.router?.url?.split('?')[0] || '/dashboard';
    const segment = path.split('/').filter(Boolean).pop() || 'dashboard';
    return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}