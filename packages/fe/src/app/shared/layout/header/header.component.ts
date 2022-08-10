import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  verUI: string = '';
  appTitle: string;

  constructor(private titleService: Title, private router: Router, private authService: AuthService) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = require('../../../../../../../package.json').version;
  }

  get app(): string {
    return ['auth', 'ticket'].includes(this.router.url.split('/')?.[1])
      ? ''
      : this.router.url.split('/')?.[2]
      ?.replace('-', ' ')
      ?.replace('%20', ' ') || '';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isLoggedIn(): boolean {
    return !!this.authService.token?.length;
  }

  get userInfo(): string {
    const username = this.authService.user?.username;
    if (username?.length) {
      return username;
    }
    return '';
  }

  onGotoClick(link: string): void {
    this.router.navigate([`/${link}`]);
  }

  async onSignOutClick(): Promise<void> {
    this.authService.logout();
    await this.router.navigate(['/']);
  }
}
