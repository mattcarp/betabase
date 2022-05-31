import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AdminService } from '../admin.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent {
  isLoading = false;

  constructor(
    private adminService: AdminService,
    private router: Router,
  ) {}

  async onSaveClick(): Promise<void> {
    this.isLoading = true;
    this.isLoading = false;
    await this.router.navigate(['/admin/user-list']);
  }
}
