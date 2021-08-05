import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import data from '../../../../../../package.json';

@Component({
  selector: 'app-dialog-faq',
  templateUrl: './dialog-faq.component.html',
  styleUrls: ['./dialog-faq.component.scss'],
})
export class DialogFaqComponent {
  appTitle: string;
  verUI: string;

  constructor(private titleService: Title) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = data.version;
  }
}
