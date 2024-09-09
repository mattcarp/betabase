import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { HeaderModule } from '../shared/layout/header/header.module';
import { AuthRoutingModule } from './auth-routing.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
import { AuthComponent } from './auth.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

@NgModule({
  declarations: [AuthComponent, SignInComponent, ResetPasswordComponent, ChangePasswordComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AuthRoutingModule,
    HeaderModule,
    SpinnerModule,
  ],
  providers: [AuthGuard, AdminGuard],
})
export class AuthModule {}
