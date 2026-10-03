import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'msgflow_theme';
  readonly theme = signal<AppTheme>(this.getStoredTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  toggleTheme(): void {
    const nextTheme: AppTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  setTheme(theme: AppTheme): void {
    this.theme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private getStoredTheme(): AppTheme {
    const saved = localStorage.getItem(this.THEME_KEY) as AppTheme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark mode for rich aesthetics or check system
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  private applyTheme(theme: AppTheme): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }
}
