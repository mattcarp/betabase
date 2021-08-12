import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Location } from '@angular/common';
import { filter, pluck } from 'rxjs/operators';

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
  activeLink = '';

  private app: string | null = null;

  constructor(private location: Location, private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
      )
      .subscribe((app: string) => this.app = app);
  }

  getLinkUrl(url: string): string {
    const link = url.replace('_APP_', `${this.app}`);
    if (this.router.url === link) {
      this.activeLink = url;
    }
    return url.replace('_APP_', `${this.app}`);
  }

  isDisabled(url: string): boolean {
    return (
      (url === '/dashboard/_APP_/show' ||
        url === '/scenario/_APP_' ||
        url === '/scenario/_APP_/new' ||
        url === '/test/_APP_') &&
      !this.app
    );
  }

  isActiveLink(url: string): boolean {
    return this.activeLink === url;
  }

  onBackClick(): void {
    this.location.back();
  }
}
