import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { ScenarioItem } from '../../shared/models';

@Component({
  selector: 'app-scenario-list',
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
})
export class ScenarioListComponent {
  scenarios: ScenarioItem[] = [];
  app: string | null = null;

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
        tap((app: string) => {
          this.app = app;
        }),
      )
      .subscribe((app: string) => this.fetchData(app));
  }

  private async fetchData(app: string): Promise<void> {
    this.scenarios = await this.appService.getAllScenarios(app);
    console.log(this.scenarios);
  }
}
