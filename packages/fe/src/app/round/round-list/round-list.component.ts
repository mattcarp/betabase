import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';
import * as moment from 'moment';

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
    const rounds = await this.appService.getAllRounds(app);
    this.rounds = rounds.map((item: RoundItem) => ({
      ...item,
      startsAt: moment(item.startsAt).isValid() ? item.startsAt : null,
      endsAt: moment(item.endsAt).isValid() ? item.endsAt : null,
      updatedAt: moment(item.updatedAt).isValid() ? item.updatedAt : null,
    }));
    this.isLoading = false;
  }
}
