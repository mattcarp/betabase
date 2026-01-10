import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
})
export class MainComponent implements OnInit {
  isSmallScreen = false;

  ngOnInit() {
    window.addEventListener('resize', this.resize, true);
    setTimeout(() => this.resize());
  }

  resize = (): void => {
    this.isSmallScreen = window.innerWidth < 846;
  };
}
