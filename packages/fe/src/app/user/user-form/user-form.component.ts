import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { filter } from 'rxjs/operators';

import { UserService } from '../user.service';
import { UserItem } from '../user-item';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent {
  isLoading = false;
  user: UserItem = {};

  private readonly adminRole = 'ROLE_ADMIN';

  constructor(
    private userService: UserService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.params
      .pipe(filter((params: Params) => 'id' in params))
      .subscribe(async ({ id }) => await this.getUserData(id));
  }

  get isAdmin(): boolean {
    return !!this.user?.roles?.includes(this.adminRole);
  }

  onAdminRoleChange(event: MatCheckboxChange): void {
    if (event.checked) {
      this.user.roles = (this.user.roles || '')
        .split(',')
        .concat(this.adminRole)
        .filter((role: string) => role?.length)
        .join(',');
    } else {
      this.user.roles = (this.user.roles || '')
        .split(',')
        .filter((role: string) => role !== this.adminRole)
        .filter((role: string) => role?.length)
        .join(',');
    }
  }

  async onSaveClick(): Promise<void> {
    this.isLoading = true;
    if (this.user.id) {
      await this.userService.updateUser(this.user);
    } else {
      const { id } = await this.userService.createUser(this.user);
      this.user.id = id;
    }
    this.isLoading = false;
    await this.router.navigate(['/user', this.user.id]);
  }

  private async getUserData(id: string): Promise<void> {
    this.isLoading = true;
    this.user = await this.userService.getUser(id);
    this.isLoading = false;
  }
}
