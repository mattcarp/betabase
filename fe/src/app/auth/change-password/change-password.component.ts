import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['../auth.component.scss'],
  host: { '[class.auth-form]': 'true' },
})
export class ChangePasswordComponent {
  form: FormGroup;
  errorMessages = {
    current: [{ type: 'required', message: 'Password is required.' }],
    password: [
      { type: 'required', message: 'Password is required' },
      { type: 'minlength', message: 'Should have at least 8 characters' },
      { type: 'maxlength', message: 'Should not have more than 32 characters' },
    ],
    rePassword: [
      { type: 'required', message: 'Password is required.' },
      { type: 'confirmedValidator', message: 'New Password and Confirm New Password must be match' },
    ],
  };
  typeCurrent = 'password';
  showCurrent = false;
  typePass = 'password';
  showPass = false;
  typeRePass = 'password';
  showRePass = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private location: Location,
    public formBuilder: FormBuilder,
  ) {
    this.form = this.formBuilder.group(
      {
        current: new FormControl('', Validators.required),
        password: new FormControl(
          '',
          Validators.compose([Validators.required, Validators.minLength(8), Validators.maxLength(32)]),
        ),
        rePassword: new FormControl('', Validators.required),
      },
      {
        validator: this.confirmedValidator('password', 'rePassword'),
      },
    );
  }

  get formControls(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  async onChangePasswordClick(
    currentPassword: string = '',
    newPassword: string = '',
    rePassword: string = '',
  ): Promise<void> {
    await this.authService.changePassword(currentPassword, newPassword, rePassword);
    await this.router.navigate(['/auth/sign-in']);
  }

  onBackClick(): void {
    this.location.back();
  }

  onShowCurrentClick(): void {
    this.showCurrent = !this.showCurrent;
    this.typeCurrent = this.showCurrent ? 'text' : 'password';
  }

  onShowPasswordClick(): void {
    this.showPass = !this.showPass;
    this.typePass = this.showPass ? 'text' : 'password';
  }

  onShowRePasswordClick(): void {
    this.showRePass = !this.showRePass;
    this.typeRePass = this.showRePass ? 'text' : 'password';
  }

  private confirmedValidator(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];
      if (matchingControl.errors && !matchingControl.errors.confirmedValidator) {
        return;
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ confirmedValidator: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }
}
