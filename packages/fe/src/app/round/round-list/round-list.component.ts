import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { RoundItem } from '../../shared/models';

@Component({
  selector: 'app-round-list',
  templateUrl: './round-list.component.html',
  styleUrls: ['./round-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class RoundListComponent {
  app: string | null = null;
  isLoading = false;
  rounds: RoundItem[] = [];

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
        tap((app: string) => this.app = app),
      )
      .subscribe((app: string) => this.fetchData(app));
  }

  private async fetchData(app: string): Promise<void> {
    this.isLoading = true;
    this.rounds = await this.appService.getAllRounds(app);
    this.isLoading = false;
  }
}
