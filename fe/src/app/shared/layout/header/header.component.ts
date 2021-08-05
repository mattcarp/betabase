import { Component, EventEmitter, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';
import data from '../../../../../package.json';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Output() emitPagePath: EventEmitter<string> = new EventEmitter<string>();
  verUI: string;
  appTitle: string;

  constructor(private titleService: Title) {
    this.appTitle = this.titleService.getTitle();
    this.verUI = data.version;
  }

  handleUrl(page: string): void {
    this.emitPagePath.emit(page);
  }

  goToHome(): void {
    this.handleUrl('main');
  }
}
