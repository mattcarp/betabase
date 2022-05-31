import { Component, OnInit } from '@angular/core';

import { UserAdminItem } from '../user-admin-item';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  tableHeaders = ['', 'User Name', 'Email', 'Enabled'];
  isLoading = false;
  users: UserAdminItem[] = [];

  constructor(private adminService: AdminService) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async onEnableUserClick(user: UserAdminItem): Promise<void> {
    console.log(user);
    this.isLoading = true;
    user.enabled = true;
    await this.adminService.updateUser(user);
    await this.loadUsers();
  }

  async onDisableUserClick(user: UserAdminItem): Promise<void> {
    this.isLoading = true;
    user.enabled = false;
    await this.adminService.updateUser(user);
    await this.loadUsers();
  }

  async onDeleteUserClick(user: UserAdminItem): Promise<void> {
    this.isLoading = true;
    // await this.adminService.deleteUser(user.username);
    // await this.loadUsers();
    console.log(user);
  }

  private async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.users = await this.adminService.getUsers();
    this.isLoading = false;
  }
}
