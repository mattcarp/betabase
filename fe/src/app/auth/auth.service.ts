import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jwt_decode from 'jwt-decode';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl: string;
  private readonly localStorageKey = 'TOKEN';

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  get token(): string | null {
    return localStorage.getItem(this.localStorageKey);
  }

  login(username: string, password: string): Promise<any> {
    const url = `${this.apiUrl}/auth/signin`;
    return this.http.post<any>(url, { username, password })
      .pipe(tap(({ accessToken }) => this.setToken(accessToken)))
      .toPromise();
  }

  logout(): void {
    localStorage.setItem(this.localStorageKey, '');
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
    if (!date) { return false; }
    return !(date.valueOf() > new Date().valueOf());
  }

  private setToken(token?: string): void {
    if (token) {
      localStorage.setItem(this.localStorageKey, token);
    }
  }
}
