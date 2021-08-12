import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import data from '../../../../../package.json';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  verUI: string;
  appTitle: string;

  constructor(private titleService: Title, private router: Router) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = data.version;
  }

  get app(): string {
    if (this.router.url.includes('auth')) {
      return '';
    }
    return this.router.url.split('/')?.[2] || '';
  }
}
