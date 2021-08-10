import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

import data from '../../../../../package.json';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  verUI: string;
  appTitle: string;

  constructor(private titleService: Title) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = data.version;
  }
}
