import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

import { Observable, of } from 'rxjs';

import { AuthService } from '../auth.service';

@Injectable()
export class AdminGuard  {
  constructor(
    private authService: AuthService,
    private location: Location,
  ) {}

  canActivate(): Observable<boolean> {
    const isAdmin = this.authService.isAdmin;
    if (!isAdmin) this.location.back();
    return of(isAdmin);
  }
}
