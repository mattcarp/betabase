import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(public router: Router) {}

  canActivate(): Observable<boolean> {
    return of(true);
  }
}
