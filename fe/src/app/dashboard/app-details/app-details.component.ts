import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as moment from 'moment';
import { filter, pluck, tap } from 'rxjs/operators';

import { ReportData, ScenarioItem } from '../models';
import { DashboardService } from '../dashboard.service';

@Component({
  selector: 'app-app-details',
  templateUrl: './app-details.component.html',
  styleUrls: ['./app-details.component.scss'],
})
export class AppDetailsComponent {
  reportData: ReportData | null = null;
  app: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private activatedRoute: ActivatedRoute,
  ) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
        tap((app: string) => this.app = app),
      )
      .subscribe((app: string) => this.fetchData(app));
  }

  get isLoading(): boolean {
    return this.reportData === null;
  }

  get roundStart(): string {
    if (!this.reportData?.roundNotes?.startsAt) { return ''; }
    return moment(this.reportData?.roundNotes?.startsAt).add(-5, 'h').format('MMM Do');
  }

  get roundEnd(): string {
    if (!this.reportData?.roundNotes?.endsAt) { return ''; }
    return moment(this.reportData?.roundNotes?.endsAt).add(-5, 'h').format('MMM Do');
  }

  get daysLeft(): number {
    if (!this.reportData?.roundNotes?.endsAt) { return 0; }
    const daysLeft = moment(this.reportData?.roundNotes?.endsAt).diff(moment(), 'days');
    return daysLeft < 0 ? 0 : daysLeft;
  }

  get percentRemain(): string {
    let msRemaining = moment(this.reportData?.roundNotes?.endsAt).diff(moment());
    if (msRemaining <  0) { msRemaining = 0; }
    const durationMs = moment(this.reportData?.roundNotes?.endsAt)
      .diff(moment(this.reportData?.roundNotes?.startsAt));
    let percentRemain = msRemaining / durationMs;
    percentRemain = (Math.round(percentRemain * 100));
    if (percentRemain > 100) { percentRemain = 100; }
    return percentRemain + '%';
  }

  get releaseDate(): string {
    if (!this.reportData?.roundNotes?.releaseDate) { return ''; }
    return moment(this.reportData?.roundNotes?.releaseDate)
      .add(-5, 'h')
      .format('ddd, MMM Do');
  }

  get deployDiff(): string {
    if (!this.reportData?.deployment?.deployedAt) { return ''; }
    return moment(this.reportData?.deployment?.deployedAt)
      .add(1, 'h')
      .fromNow();
  }

  get deployDate(): string {
    if (!this.reportData?.deployment?.deployedAt) { return ''; }
    return moment(this.reportData?.deployment?.deployedAt)
      .add(1, 'h')
      .format('MMM Do, h:mm a');
  }

  get overallRatio(): string {
    let regressionRatio = 0;
    let enhancementRatio = 0;
    let regressionCount = 0;
    let enhancementCount = 0;

    if (this.reportData?.regressionScenarios?.length !== 0) {
      const { testedCount, totalCount } = this.getCounts('regressionScenarios');
      regressionCount = totalCount;
      regressionRatio =  testedCount / totalCount;
    }

    if (this.reportData?.enhancementScenarios?.length !== 0) {
      const { testedCount, totalCount } = this.getCounts('enhancementScenarios');
      enhancementCount = totalCount;
      enhancementRatio =  testedCount / totalCount;
    }

    const totalCount = regressionCount + enhancementCount;
    const regressionWeight = regressionCount / totalCount;
    const enhancementWeight = enhancementCount / totalCount;
    const weightedAvg = (enhancementWeight * enhancementRatio) + (regressionWeight * regressionRatio);
    return (Math.round(weightedAvg * 100)) + '%';
  }

  getRatio(key: string): string {
    const { testedCount, totalCount } = this.getCounts(key);
    let ratio = 0;
    if (testedCount !== 0) {
      ratio = testedCount / totalCount;
    }
    return (Math.round(ratio * 100)) + '%';
  }

  getMostRecentText(mostRecent: string | Date | undefined): string {
    let result = '';
    const mostRecentMoment = mostRecent === null ? moment(mostRecent) : moment();
    const roundStartMoment = moment(this.reportData?.roundNotes?.startsAt).add(-5, 'h');
    if (mostRecent === null || (mostRecentMoment.utc().valueOf() < roundStartMoment.utc().valueOf())) {
      result = 'none this round';
    } else if (mostRecentMoment.utc().valueOf() > roundStartMoment.utc().valueOf()) {
      result = mostRecentMoment.utc().format('Y-M-D');
    }
    return result;
  }

  private getCounts(key: string): { testedCount: number, totalCount: number } {
    let testedCount = 0;
    const reportData = this.reportData as any;
    reportData?.[key]?.forEach((item: ScenarioItem) => {
      testedCount += item?.mostRecent ? 1 : 0;
    });
    return { testedCount, totalCount: reportData?.[key]?.length }
  }

  private async fetchData(app: string): Promise<void> {
    const a = moment().valueOf();
    console.log(a);
    this.reportData = await this.dashboardService.getAppReportData(app);
    console.log(this.reportData);
  }
}
