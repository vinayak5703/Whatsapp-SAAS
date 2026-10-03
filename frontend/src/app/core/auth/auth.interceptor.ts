import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  const requestWithCookies = request.clone({ withCredentials: true });

  if (!token || request.url.endsWith('/auth/login') || request.url.endsWith('/auth/register')) {
    return next(requestWithCookies);
  }

  return next(requestWithCookies.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};