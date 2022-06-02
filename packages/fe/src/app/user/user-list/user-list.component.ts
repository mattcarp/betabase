import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';

import { UserItem } from '../user-item';
import { UserService } from '../user.service';
import { DialogWarningComponent } from '../../shared/layout/dialog-warning/dialog-warning.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class UserListComponent implements OnInit {
  tableHeaders = ['#', 'User Name', 'Email', 'Role', 'Last Login', 'Enabled', 'Actions'];
  isLoading = false;
  users: UserItem[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private dialog: MatDialog,
    private userService: UserService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async onEnableClick(user: UserItem): Promise<void> {
    this.isLoading = true;
    user.enabled = true;
    await this.userService.updateUser(user);
    await this.loadUsers();
  }

  async onDisableClick(user: UserItem): Promise<void> {
    this.isLoading = true;
    user.enabled = false;
    await this.userService.updateUser(user);
    await this.loadUsers();
  }

  async onDeleteClick(user: UserItem): Promise<void> {
    this.dialog.open(DialogWarningComponent, {
      data: 'delete',
      width: '500px',
      autoFocus: false,
    }).afterClosed()
      .pipe(filter((remove: boolean) => remove))
      .subscribe(async () => {
        this.isLoading = true;
        await this.userService.deleteUser(user);
        await this.loadUsers();
      });
  }

  async onEditClick(user: UserItem): Promise<void> {
    await this.router.navigate(['/user', user.id]);
  }

  getRoles(roles: string | undefined): any {
    let result = '';
    roles?.split(',').forEach((item: string) => {
      switch (item) {
        case 'ROLE_SUPER_ADMIN':
          result = result.concat('<span class="role super">Super Admin</span>');
          break;
        case 'ROLE_ADMIN':
          result = result.concat('<span class="role admin">Admin</span>');
          break;
        case 'ROLE_CLIENT':
          result = result.concat('<span class="role client">Client</span>');
          break;
        case 'ROLE_TECH_CONTACT':
          result = result.concat('<span class="role support">Support</span>');
          break;
        default:
          break;
      }
    });
    return result;
  }

  onBackClick(): void {
    this.location.back();
  }

  private async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.users = await this.userService.getUsers();
    this.isLoading = false;
  }
}
