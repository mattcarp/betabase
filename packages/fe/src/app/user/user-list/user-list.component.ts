import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UserItem } from '../user-item';
import { UserService } from '../user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  tableHeaders = ['', 'User Name', 'Email', 'Enabled'];
  isLoading = false;
  users: UserItem[] = [];

  constructor(
    private userService: UserService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async onEnableUserClick(user: UserItem): Promise<void> {
    this.isLoading = true;
    user.enabled = true;
    await this.userService.updateUser(user);
    await this.loadUsers();
  }

  async onDisableUserClick(user: UserItem): Promise<void> {
    this.isLoading = true;
    user.enabled = false;
    await this.userService.updateUser(user);
    await this.loadUsers();
  }

  async onDeleteUserClick(user: UserItem): Promise<void> {
    this.isLoading = true;
    await this.userService.deleteUser(user);
    await this.loadUsers();
  }

  async onUserClick(user: UserItem): Promise<void> {
    await this.router.navigate(['/user', user.id]);
  }

  private async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.users = await this.userService.getUsers();
    this.isLoading = false;
  }
}
