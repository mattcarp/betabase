import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { HeaderModule } from '../shared/layout/header/header.module';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { AuthGuard } from './guards/auth.guard';
import { SignInComponent } from './sign-in/sign-in.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AdminGuard } from './guards/admin.guard';

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
  ],
  providers: [AuthGuard, AdminGuard],
})
export class AuthModule {}
