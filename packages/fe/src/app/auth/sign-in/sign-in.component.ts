import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../auth.service';
import { DialogWarningComponent } from '../../shared/layout/dialog-warning/dialog-warning.component';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['../auth.component.scss'],
  host: { '[class.auth-form]': 'true' },
})
export class SignInComponent {
  emailFormControl = new FormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new FormControl('', [Validators.required]);
  typePass = 'password';
  showPass = false;
  isLoading = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
  ) {}

  async onSignInClick(email: string = '', password: string = ''): Promise<void> {
    this.isLoading = true;
    try {
      await this.authService.login(email, password);
      await this.router.navigate(['/dashboard']);
    } catch (e) {
      this.dialog.open(DialogWarningComponent, {
        data: 'auth',
        width: '250px',
        autoFocus: false,
      });
    }
    this.isLoading = false;
  }

  showPassword() {
    this.showPass = !this.showPass;
    this.typePass = this.showPass ? 'text' : 'password';
  }
}
