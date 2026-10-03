import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  const tenantId = auth.currentUser()?.tenantId || '';
  const requestWithCookies = request.clone({ withCredentials: true });

  if (request.url.endsWith('/auth/login') || request.url.endsWith('/auth/register')) {
    return next(requestWithCookies);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return next(requestWithCookies.clone({
    setHeaders: headers,
  }));
};