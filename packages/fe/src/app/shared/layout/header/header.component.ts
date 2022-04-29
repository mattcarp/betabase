import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  verUI: string = '';
  appTitle: string;
  userName: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private titleService: Title,
    private router: Router,
    private authService: AuthService,
    private keycloakService: KeycloakService,
  ) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = require('../../../../../../../package.json').version;
  }

  get app(): string {
    return this.router.url.includes('auth')
      ? ''
      : this.router.url.split('/')?.[2]?.replace('-', ' ').replace('%20', ' ');
  }

  get isAdmin(): boolean {
    return this.router.url.includes('round');
  }

  onGotoClick(link: string): void {
    this.router.navigate([`/${link}`]);
  }

  async onSignOutClick(): Promise<void> {
    await this.keycloakService.logout();
  }

  async ngOnInit(): Promise<void> {
    this.isLoggedIn = await this.keycloakService.isLoggedIn();
    await this.keycloakService.loadUserProfile();
    this.userName = this.keycloakService.getUsername();
  }
}
