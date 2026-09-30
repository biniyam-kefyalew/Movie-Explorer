import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Functional guard for admin route verification.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AdminAuthService);
  return authService.isAuthenticated();
};
