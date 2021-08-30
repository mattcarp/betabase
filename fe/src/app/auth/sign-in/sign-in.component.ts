import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['../auth.component.scss'],
})
export class SignInComponent {
  @ViewChild('username') username: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('password') password: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('rect') rect: ElementRef | undefined;

  constructor(private router: Router, private authService: AuthService) {
    setTimeout(() => this.password?.nativeElement.focus(), 500);
    setTimeout(() => this.username?.nativeElement.focus(), 1500);
  }

  setFocus(className: string): void {
    this.rect?.nativeElement.setAttribute('class', className);
  }

  async onSignInClick(username: string = '', password: string = ''): Promise<void> {
    await this.authService.login(username, password);
    await this.router.navigate(['/dashboard']);
  }
}
