import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

declare let require: any;
const fs = require('../../package.json');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private appTitle = 'Beta Base';
  private build = '';

  constructor(private titleService: Title) {
    this.titleService.setTitle(this.appTitle);

    const style = [
      'padding: 4px 10px;',
      'background: linear-gradient(#587887, #57a0bf);',
      'font: normal 12px/1 Roboto, Helvetica, Arial;',
      'color: #fff;',
      'border-radius: 3px;',
    ].join('');

    console.log(
      `%c ${this.appTitle} %c ${this.isBuildDev ? '❗localhost' : ''} %c ${this.build} UI v.${fs.version}`,
      style,
      '',
      '',
    );
  }

  get isBuildDev(): boolean {
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
      this.build = '[DEV]';
    } else {
      this.build = '';
    }
    return isDev;
  }
}
