import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../config/environment';
import { ApiResponse, CurrentUser, LoginResult } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenState = signal<string | null>(null);
  private readonly currentUserState = signal<CurrentUser | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isSignedIn = computed(() => this.accessTokenState() !== null);

  get accessToken(): string | null {
    return this.accessTokenState();
  }

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${environment.apiBaseUrl}/auth/login`, {
        email,
        password,
      }, { withCredentials: true })
      .pipe(map((response) => response.data), tap((result) => this.setSession(result)));
  }

  register(values: {
    businessName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Observable<LoginResult> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${environment.apiBaseUrl}/auth/register`, values, {
        withCredentials: true,
      })
      .pipe(map((response) => response.data), tap((result) => this.setSession(result)));
  }

  refreshSession(): Observable<boolean> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${environment.apiBaseUrl}/auth/refresh`, {}, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.data),
        tap((result) => this.setSession(result)),
        map(() => true),
        catchError(() => {
          this.clearSession();
          return of(false);
        }),
      );
  }

  logout(): Observable<unknown> {
    return this.http
      .post(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  clearSession(): void {
    this.accessTokenState.set(null);
    this.currentUserState.set(null);
    try {
      sessionStorage.clear();
      localStorage.removeItem('user_session');
    } catch {
      // ignore in environments where storage is restricted
    }
  }

  private setSession(result: LoginResult): void {
    this.accessTokenState.set(result.accessToken);
    this.currentUserState.set(result.user);
  }
}