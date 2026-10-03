import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSignedIn()) return true;
  return auth.refreshSession().pipe(map((isSignedIn) =>
    isSignedIn ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }),
  ));
};