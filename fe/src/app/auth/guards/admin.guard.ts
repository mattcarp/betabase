import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { CanActivate } from '@angular/router';
import { Observable, of } from 'rxjs';

import { AuthService } from '../auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
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
