import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
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

  private app: string | null = null;

  constructor(private location: Location, private activatedRoute: ActivatedRoute) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
      )
      .subscribe((app: string) => this.app = app);
  }

  getLinkUrl(url: string): string {
    return url.replace('_APP_', `${this.app}`);
  }

  isDisabled(url: string): boolean {
    return url === 'scenario' && !this.app;
  }

  onBackClick(): void {
    this.location.back();
  }
}
