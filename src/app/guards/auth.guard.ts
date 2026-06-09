import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // Redirect to home with a query param so the page can show a message
  return router.createUrlTree(['/'], { queryParams: { blocked: 'auth' } });
};
