import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../auth.service';

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  private horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  private verticalPosition: MatSnackBarVerticalPosition = 'top';

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: any): Observable<any> => {
        this.showErrorNotification(err?.message)
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/auth/sign-in']);
        }
        return of(null);
      }),
    );
  }

  private showErrorNotification(message: string): void {
    this.snackBar.open(message, '', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      duration: 5000,
    });
  }
}
