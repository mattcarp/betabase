import { Component } from '@angular/core';

@Component({
  selector: 'app-message-alarm',
  templateUrl: './message-alarm.component.html',
  styleUrls: ['./message-alarm.component.scss'],
})
export class MessageAlarmComponent {
  currentWidth = 0;

  constructor() {
    this.onResize();
  }

  onResize() {
    this.currentWidth = window.innerWidth;
  }
}
