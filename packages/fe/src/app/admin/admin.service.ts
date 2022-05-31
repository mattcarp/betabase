import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { UserAdminItem } from './user-admin-item';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  async getUsers(): Promise<UserAdminItem[]> {
    const url = `${this.apiUrl}/users`;
    return firstValueFrom(this.http.get<UserAdminItem[]>(url));
  }

  async updateUser(user: UserAdminItem): Promise<UserAdminItem> {
    const url = `${this.apiUrl}/users/${user.id}`;
    return firstValueFrom(this.http.put<UserAdminItem>(url, user));
  }
}
