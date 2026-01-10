import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import jwt_decode from 'jwt-decode';
import { filter, tap, catchError } from 'rxjs/operators';
import { firstValueFrom, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from '../shared/models';
import { DialogWarningComponent } from '../shared/layout/dialog-warning/dialog-warning.component';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl: string;
  private readonly localStorageKeys = {
    token: 'TOKEN',
    user: 'USER',
  };

  constructor(private http: HttpClient, private dialog: MatDialog) {
    this.apiUrl = environment.apiUrl;
    console.log('API URL:', this.apiUrl); // Log the API URL
  }

  get token(): string | null {
    return sessionStorage.getItem(this.localStorageKeys.token);
  }

  get user(): User | null {
    const userParams = sessionStorage.getItem(this.localStorageKeys.user);
    return userParams ? JSON.parse(userParams) : null;
  }

  get isAdmin(): boolean {
    return !!(this.user?.roles || '').split(',').find((role: string) => role === 'ROLE_ADMIN');
  }

  login(username: string, password: string): Promise<User> {
    const url = `${this.apiUrl}/auth/sign-in`;
    console.log('Login attempt:', { username, url }); // Log login attempt
    return firstValueFrom(this.http
      .post<User>(url, { username, password })
      .pipe(
        tap((user: User) => console.log('Login response:', user)), // Log the response
        filter((user: User) => {
          if (!user.enabled) {
            console.log('User is disabled'); // Log if user is disabled
            this.dialog.open(DialogWarningComponent, {
              data: 'userDisabled',
              width: '400px',
              autoFocus: false,
            });
          }
          return !!user.enabled;
        }),
        tap((user: User) => this.setParams(user)),
        catchError((error) => {
          console.error('Login error:', error); // Log any errors
          return throwError(() => error);
        })
      ));
  }

  logout(): void {
    sessionStorage.removeItem(this.localStorageKeys.token);
  }

  getTokenExpirationDate(token: string): Date | null {
    const decoded: any = jwt_decode(token);
    if (!decoded.exp) { return null; }
    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);
    return date;
  }

  isTokenExpired(): boolean {
    const token = this.token;
    if (!token) { return true; }
    const date = this.getTokenExpirationDate(token);
    if (!date) { return true; }
    return !(date.valueOf() > new Date().valueOf());
  }

  changePassword(currentPassword: string, newPassword: string, rePassword: string): any {
    // TODO: need to do it
    return { currentPassword, newPassword, rePassword };
  }

  resetPassword(email: string): Promise<string> {
    const url = `${this.apiUrl}/auth/reset-password`;
    return firstValueFrom(this.http.post<string>(url, { email }));
  }

  setPasswordWithToken(password: string, token: string): Promise<string> {
    const url = `${this.apiUrl}/auth/set-password-with-token`;
    return firstValueFrom(this.http.post<string>(url, { password, token }));
  }

  private setParams(params: User): void {
    if (params?.accessToken?.length) {
      sessionStorage.setItem(this.localStorageKeys.token, params.accessToken);
    }
    if (!!params?.id) {
      const { id, username, email, roles, jiraUsername } = params;
      const userParams = JSON.stringify({ id, username, email, roles, jiraUsername });
      sessionStorage.setItem(this.localStorageKeys.user, userParams);
    }
  }
}
