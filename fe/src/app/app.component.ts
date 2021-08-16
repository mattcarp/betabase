import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import data from 'package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private appTitle = 'βetabase';
  private build = '';

  constructor(private titleService: Title) {
    this.titleService.setTitle(this.appTitle);

    const style = [
      'padding: 4px 10px;',
      'background: linear-gradient(#a400a5, #611c61);',
      'font: normal 12px/1 Roboto, Helvetica, Arial;',
      'color: #fff;',
      'border-radius: 3px;',
    ].join('');

    console.log(
      `%c ${this.appTitle} %c ${this.isBuildDev ? '❗localhost' : ''} %c ${this.build} UI v.${data.version}`,
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
