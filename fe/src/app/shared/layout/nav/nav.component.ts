import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { NavConstants } from './nav.constant';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  @Input() isBackActive?: boolean = false;
  buttons = NavConstants.navButtons;

  constructor(private router: Router, private location: Location) {}

  onBackClick(): void {
    this.location.back();
  }

  onButtonClick(url: string): void {
    this.router.navigate([`/${url}`]);
  }
}
