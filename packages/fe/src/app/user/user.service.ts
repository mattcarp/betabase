import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { UserItem } from './user-item';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  async getUsers(): Promise<UserItem[]> {
    const url = `${this.apiUrl}/users`;
    return firstValueFrom(this.http.get<UserItem[]>(url));
  }

  async updateUser(user: UserItem): Promise<UserItem> {
    const url = `${this.apiUrl}/users/${user.id}`;
    return firstValueFrom(this.http.put<UserItem>(url, user));
  }

  async createUser(user: UserItem): Promise<UserItem> {
    const url = `${this.apiUrl}/users`;
    user.salt = String(Date.now().valueOf());
    return firstValueFrom(this.http.post<UserItem>(url, user));
  }

  async deleteUser(user: UserItem): Promise<UserItem> {
    const url = `${this.apiUrl}/users/${user.id}`;
    return firstValueFrom(this.http.delete<UserItem>(url));
  }

  async getUser(id: string): Promise<UserItem> {
    const url = `${this.apiUrl}/users/${id}`;
    return firstValueFrom(this.http.get<UserItem>(url));
  }
}
