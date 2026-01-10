import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
})
export class SpinnerComponent {
  randomInt = 0;

  constructor() {
    this.randomInt = Math.floor(Math.random() * 3);
  }
}
