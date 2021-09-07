import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { filter } from 'rxjs/operators';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['../auth.component.scss'],
  host: { '[class.auth-form]': 'true' },
})
export class ResetPasswordComponent {
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  message = '';
  token = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
  ) {
    activatedRoute.queryParams
      .pipe(filter((params: Params) => 'token' in params))
      .subscribe(({ token }) => this.token = token);
  }

  async onResetPasswordClick(email: string = ''): Promise<void> {
    this.message = await this.authService.resetPassword(email);
  }

  async onSetPasswordClick(password: string = ''): Promise<void> {
    this.message = await this.authService.setPasswordWithToken(password, this.token);
  }
}
