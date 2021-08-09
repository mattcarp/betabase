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
  @Input() app?: string | null = null;
  buttons = NavConstants.navButtons;

  constructor(private router: Router, private location: Location) {}

  isDisabled(url: string): boolean {
    return url === 'scenario' && !this.app;
  }

  onBackClick(): void {
    this.location.back();
  }

  onButtonClick(url: string, app: string | null = null): void {
    if (app?.length) {
      this.router.navigate([`/${url}/${app}`]);
    } else {
      this.router.navigate([`/${url}`]);
    }
  }
}
