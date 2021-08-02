import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { ScenarioItem, TestItem } from '../../shared/models';

@Component({
  selector: 'app-scenario-details',
  templateUrl: './scenario-details.component.html',
  styleUrls: ['./scenario-details.component.scss'],
})
export class ScenarioDetailsComponent implements OnInit {
  scenario: ScenarioItem | null = null;
  tests: TestItem[] = [];

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

  ngOnInit(): void {
  }

  private async fetchData(id: string): Promise<void> {
    const { scenario, tests } = await this.appService.getScenario(id);
    this.scenario = scenario;
    this.tests = tests;
  }
}
