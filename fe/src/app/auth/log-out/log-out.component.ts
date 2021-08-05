import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-log-out',
  templateUrl: './log-out.component.html',
  styleUrls: ['../auth.component.scss'],
})
export class LogOutComponent {
  appTitle: string;

  constructor(private titleService: Title, private router: Router) {
    this.appTitle = this.titleService.getTitle();
  }

  goToPage(page: string): void {
    this.router.navigate([`/${page}`]);
  }
}
