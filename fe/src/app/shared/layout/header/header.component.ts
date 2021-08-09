import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import data from '../../../../../package.json';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  app: string | null = null;
  verUI: string;
  appTitle: string;

  constructor(private titleService: Title, private router: Router) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = data.version;
  }

  goToHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
