import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { filter, pluck } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { RoundItem } from '../../shared/models';

@Component({
  selector: 'app-round-details',
  templateUrl: './round-details.component.html',
  styleUrls: ['./round-details.component.scss'],
  host: { '[class.page]': 'true' },
})
export class RoundDetailsComponent {
  round: RoundItem | null = null;

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));
  }

  async onDeleteClick(): Promise<void> {
    await this.appService.deleteRound(this.round?.id);
    await this.router.navigate(['/round', this.round?.app]);
  }

  private async fetchData(id: string): Promise<void> {
    this.round = await this.appService.getRound(id);
  }
}
