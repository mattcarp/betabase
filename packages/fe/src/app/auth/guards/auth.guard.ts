import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard  {
  constructor(
    private authService: AuthService,
    public router: Router,
  ) {}

  canActivate(): Observable<boolean> {
    if (!this.authService.isTokenExpired()) {
      return of(true);
    }
    this.authService.logout();
    this.router.navigate(['/auth/sign-in']);
    return of(false);
  }
}
