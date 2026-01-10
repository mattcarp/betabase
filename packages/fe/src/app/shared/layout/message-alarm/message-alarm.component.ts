import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-message-alarm',
  templateUrl: './message-alarm.component.html',
  styleUrls: ['./message-alarm.component.scss'],
})
export class MessageAlarmComponent implements OnInit {
  currentWidth = 0;

  ngOnInit() {
    window.addEventListener('resize', this.resize, true);
    setTimeout(() => this.resize());
  }

  resize = (): void => {
    this.currentWidth = window.innerWidth;
  };
}
