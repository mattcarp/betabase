import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeaderModule } from '../shared/layout/header/header.module';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { LogOutComponent } from './log-out/log-out.component';
import { AuthGuard } from './guards/auth.guard';

@NgModule({
  declarations: [AuthComponent, SignInComponent, LogOutComponent],
  imports: [CommonModule, AuthRoutingModule, HeaderModule],
  providers: [AuthGuard],
})
export class AuthModule {}
