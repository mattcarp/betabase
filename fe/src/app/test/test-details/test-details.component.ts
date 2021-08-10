import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';

import { ScenarioItem, TestItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';

@Component({
  selector: 'app-test-details',
  templateUrl: './test-details.component.html',
  styleUrls: ['./test-details.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestDetailsComponent {
  scenario: ScenarioItem | null = null;
  test: TestItem | null = null;
  isLoading = false;

  constructor(
    private appService: AppService,
    private activatedRoute: ActivatedRoute,
  ) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));
  }

  private async fetchData(id: string): Promise<void> {
    this.isLoading = true;
    this.test = await this.appService.getTest(id);
    const { scenario } = await this.appService.getScenario(`${this.test.scenarioId}`);
    this.scenario = scenario;
    this.isLoading = false;
  }
}
