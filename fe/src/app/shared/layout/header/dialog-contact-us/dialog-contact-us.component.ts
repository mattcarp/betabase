import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-dialog-contact-us',
  templateUrl: './dialog-contact-us.component.html',
  styleUrls: ['./dialog-contact-us.component.scss'],
})
export class DialogContactUsComponent {
  appTitle: string;

  constructor(private titleService: Title) {
    this.appTitle = this.titleService.getTitle();
  }
}
