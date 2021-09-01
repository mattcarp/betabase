import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';

import { AuthService } from '../auth.service';

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

  constructor(private router: Router, private authService: AuthService) {}

  async onSignInClick(email: string = '', password: string = ''): Promise<void> {
    await this.authService.login(email, password);
    await this.router.navigate(['/dashboard']);
  }

  showPassword() {
    this.showPass = !this.showPass;
    this.typePass = this.showPass ? 'text' : 'password';
  }
}
