import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jwt_decode from 'jwt-decode';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { User } from '../shared/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl: string;
  private readonly localStorageKeys = {
    token: 'TOKEN',
    user: 'USER',
  };

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  get token(): string | null {
    return sessionStorage.getItem(this.localStorageKeys.token);
  }

  get user(): User | null {
    const userParams = sessionStorage.getItem(this.localStorageKeys.user);
    return userParams ? JSON.parse(userParams) : null;
  }

  login(username: string, password: string): Promise<User> {
    const url = `${this.apiUrl}/auth/sign-in`;
    return this.http
      .post<User>(url, { username, password })
      .pipe(tap((params: User) => this.setParams(params)))
      .toPromise();
  }

  logout(): void {
    sessionStorage.setItem(this.localStorageKeys.token, '');
  }

  getTokenExpirationDate(token: string): Date | null {
    const decoded: any = jwt_decode(token);
    if (!decoded.exp) { return null; }
    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);
    return date;
  }

  isTokenExpired(): boolean {
    const { token } = this;
    if (!token) { return true; }
    const date = this.getTokenExpirationDate(token);
    if (!date) { return false; }
    return !(date.valueOf() > new Date().valueOf());
  }

  changePassword(currentPassword: string, newPassword: string, rePassword: string): any {
    // TODO: need to do it
    return { currentPassword, newPassword, rePassword };
  }

  resetPassword(email: string): any {
    // TODO: need to do it
    return email;
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
