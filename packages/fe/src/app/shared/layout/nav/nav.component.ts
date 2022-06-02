import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Location } from '@angular/common';
import { filter, pluck } from 'rxjs/operators';

import { NavConstants } from './nav.constant';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {
  @Input() isBackActive?: boolean = false;
  buttons = NavConstants.navButtons;

  private app: string | null = null;

  constructor(
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
      )
      .subscribe((app: string) => {
        this.app = app;
      });
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isSupport(): boolean {
    return this.router.url.includes('support');
  }

  getLinkUrl(url: string): string {
    return url.replace('_APP_', `${this.app}`);
  }

  isDisabled(url: string): boolean {
    return (
      (url === '/dashboard/_APP_/show'
        || url === '/scenario/_APP_'
        || url === '/scenario/_APP_/new'
        || url === '/test/_APP_')
      && !this.app);
  }

  onBackClick(): void {
    this.location.back();
  }
}
