import { Component } from '@angular/core';
import { ActivatedRoute, Params} from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import * as moment from 'moment';
import { filter, pluck, tap } from 'rxjs/operators';

import { ReportData, ScenarioItem, TestItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';
import { detailsChartOptions } from './app-details.constants';

@Component({
  selector: 'app-app-details',
  templateUrl: './app-details.component.html',
  styleUrls: ['./app-details.component.scss'],
  host: { '[class.page]': 'true' },
})
export class AppDetailsComponent {
  reportData: ReportData | null = null;
  reportDataInitial: ReportData | null = null;
  app = '';
  isNewFeaturesChecked = false;
  numNewFeaturesChecked = 0;
  isPrioritiesChecked = false;
  numPrioritiesChecked = 0;
  isRegressionsChecked = false;
  numRegressionsChecked = 0;
  draggedItems = {
    enhancementScenarios: false,
    priorityScenarios: false,
    regressionScenarios: false,
  };
  chartDisplayOptions = detailsChartOptions;

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

  get isLoading(): boolean {
    return this.reportData === null;
  }

  get roundStart(): string {
    if (!this.reportData?.roundNotes?.startsAt) {
      return '';
    }
    return moment(this.reportData?.roundNotes?.startsAt).add(-5, 'h').format('MMM Do');
  }

  get roundEnd(): string {
    if (!this.reportData?.roundNotes?.endsAt) {
      return '';
    }
    return moment(this.reportData?.roundNotes?.endsAt).add(-5, 'h').format('MMM Do');
  }

  get daysLeft(): number {
    if (!this.reportData?.roundNotes?.endsAt) {
      return 0;
    }
    const daysLeft = moment(this.reportData?.roundNotes?.endsAt).diff(moment(), 'days');
    return daysLeft < 0 ? 0 : daysLeft;
  }

  get percentRemain(): string {
    let msRemaining = moment(this.reportData?.roundNotes?.endsAt).diff(moment());
    if (msRemaining < 0) {
      msRemaining = 0;
    }
    const durationMs = moment(this.reportData?.roundNotes?.endsAt).diff(moment(this.reportData?.roundNotes?.startsAt));
    let percentRemain = msRemaining / durationMs || 0;
    percentRemain = Math.round(percentRemain * 100);
    if (percentRemain > 100) {
      percentRemain = 100;
    }
    return `${percentRemain}%`;
  }

  get releaseDate(): string {
    if (!this.reportData?.roundNotes?.releaseDate) {
      return '';
    }
    return moment(this.reportData?.roundNotes?.releaseDate).add(-5, 'h').format('ddd, MMM Do');
  }

  get deployDiff(): string {
    if (!this.reportData?.deployment?.deployedAt) {
      return '';
    }
    return moment(this.reportData?.deployment?.deployedAt).add(1, 'h').fromNow();
  }

  get deployDate(): string {
    if (!this.reportData?.deployment?.deployedAt) {
      return '';
    }
    return moment(this.reportData?.deployment?.deployedAt).add(1, 'h').format('MMM Do, h:mm a');
  }

  get overallRatio(): string {
    let regressionRatio = 0;
    let enhancementRatio = 0;
    let regressionCount = 0;
    let enhancementCount = 0;

    if (this.reportData?.regressionScenarios?.length !== 0) {
      const { testedCount, totalCount } = this.getCounts('regressionScenarios');
      regressionCount = totalCount;
      regressionRatio = testedCount / totalCount;
    }

    if (this.reportData?.enhancementScenarios?.length !== 0) {
      const { testedCount, totalCount } = this.getCounts('enhancementScenarios');
      enhancementCount = totalCount;
      enhancementRatio = testedCount / totalCount;
    }

    const totalCount = regressionCount + enhancementCount;
    const regressionWeight = regressionCount / totalCount;
    const enhancementWeight = enhancementCount / totalCount;
    const weightedAvg = enhancementWeight * enhancementRatio + regressionWeight * regressionRatio || 0;
    return `${Math.round(weightedAvg * 100)}%`;
  }

  get imageUrl(): string {
    if (this.app) {
      switch (this.app) {
        case 'aoma':
          return '/assets/logos/aoma-logo.gif';
        case 'promo':
          return '/assets/logos/promo-logo.png';
        case 'promo-admin':
          return '/assets/logos/promo-admin-logo.png';
        case 'Partner Previewer':
          return '/assets/logos/partner-logo.png';
       case 'dx':
          return '/assets/logos/dx-logo.png';
        default:
          return '';
      }
    }
    return '';
  }

  get appTitle(): string {
    return this.app.replace('-', ' ').toUpperCase();
  }

  getRatio(key: string): string {
    const { testedCount, totalCount } = this.getCounts(key);
    let ratio = 0;
    if (testedCount !== 0) {
      ratio = testedCount / totalCount;
    }
    return `${Math.round(ratio * 100)}%`;
  }

  getMostRecentText(mostRecent: string | Date = ''): string[] {
    let result = ['', ''];
    const mostRecentMoment = mostRecent === null ? moment(mostRecent) : moment();
    const roundStartMoment = moment(this.reportData?.roundNotes?.startsAt).add(-5, 'h');
    if (mostRecent === null || mostRecentMoment.utc().valueOf() < roundStartMoment.utc().valueOf()) {
      result = ['none this round', 'red'];
    } else if (mostRecentMoment.utc().valueOf() > roundStartMoment.utc().valueOf()) {
      result = [mostRecentMoment.utc().format('Y-M-D'), ''];
    }
    return result;
  }

  onClickScrollToElement(elementId: string): void {
    document.getElementById(elementId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }

  onNewFeaturesPassClick(): void {
    document.querySelectorAll('.new-features-pass').forEach((el: Element, index: number) => {
      if (!this.isNewFeaturesChecked) {
        this.numNewFeaturesChecked = index + 1;
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    });
  }

  onPrioritiesPassClick(): void {
    document.querySelectorAll('.priorities-pass').forEach((el: Element, index: number) => {
      if (!this.isPrioritiesChecked) {
        this.numPrioritiesChecked = index + 1;
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    });
  }

  onRegressionsPassClick(): void {
    document.querySelectorAll('.regressions-pass').forEach((el: Element, index: number) => {
      if (!this.isRegressionsChecked) {
        this.numRegressionsChecked = index + 1;
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    });
  }

  async onChangeItemOrder(event: CdkDragDrop<ScenarioItem[]>, type: string): Promise<void> {
    const reportData = this.reportData as any;
    const items = reportData[type].slice();
    const selectedItem = items[event.previousIndex];
    const restItems = items.slice().filter((item: ScenarioItem) => item.id !== selectedItem.id);
    const prevItems = restItems.slice(0, event.currentIndex);
    const nextItems = restItems.slice(event.currentIndex, items.length);
    reportData[type] = [...prevItems, selectedItem, ...nextItems];
    this.draggedItems = {
      ...this.draggedItems,
      [type]: true,
    };
  }

  async onSaveItemOrder(type: string): Promise<void> {
    const reportData = this.reportData as any;
    await this.appService.updateScenarioOrder(reportData[type], type);
    this.draggedItems = {
      ...this.draggedItems,
      [type]: false,
    };
  }

  onCancelItemOrder(type: string): void {
    const reportData = this.reportData as any;
    const reportDataInitial = this.reportDataInitial as any;
    reportData[type] = reportDataInitial[type];
    this.draggedItems = {
      ...this.draggedItems,
      [type]: false,
    };
  }

  private getCounts(key: string): { testedCount: number; totalCount: number } {
    let testedCount = 0;
    const reportData = this.reportData as any;
    reportData?.[key]?.forEach((item: ScenarioItem) => {
      testedCount += item?.mostRecent ? 1 : 0;
    });
    return { testedCount, totalCount: reportData?.[key]?.length };
  }

  private async fetchData(app: string): Promise<void> {
    this.reportData = await this.appService.getAppReportData(app);
    this.reportDataInitial = JSON.parse(JSON.stringify(this.reportData));

    // Data for Charts
    // - Completion
    const overall = parseInt(this.overallRatio.replace('%', ''));
    const completion = this.chartDisplayOptions.completion;
    completion.datasets[0].data = [];
    completion.labels = [];
    if (overall) {
      completion.datasets[0].data.push(overall);
      completion.labels.push('Finished');
      completion.datasets[0].data.push(100 - overall);
      completion.labels.push('In Progress');
      completion.result = overall;
    }
    completion.isLoading = false;

    const tests = await this.appService.getAllTests(this.app);

    // - Browser
    const browsers = tests.map((test: TestItem) => test.browserName).sort();
    const browserName = [...new Set(browsers)];
    const browser = this.chartDisplayOptions.browser;
    browser.datasets[0].data = [];
    browser.labels = [];
    browserName.forEach((item: string | undefined) => {
      const number = browsers.filter(browser => browser === item).length;
      browser.datasets[0].data.push(number);
      browser.labels.push(item || '');
    });
    browser.isLoading = false;

    // - Total Tests by Date
    const years = tests.map((test: TestItem) => moment(test.createdAt).format('YYYY')).sort();
    const yearName = [...new Set(years)];
    // -- For new features
    const yearsFeatures = this.reportData.enhancementScenarios
      .map((item: ScenarioItem) => moment(item.mostRecent).format('YYYY')).sort();
    const yearFeaturesName = [...new Set(yearsFeatures)];
    const lastYearFeatures = yearFeaturesName[yearFeaturesName.length - 1];
    const lastNumFeatures = yearsFeatures.filter(item => item === lastYearFeatures).length;
    const total = this.chartDisplayOptions.total;
    total.datasets[0].data = [];
    total.datasets[0].label = [];
    total.datasets[1].data = [];
    total.datasets[1].label = [];
    total.labels = [];
    const lastYear = parseInt(yearName[yearName.length - 1]);
    const now = new Date().getFullYear();
    for (let i = 0; i < now - lastYear; i += 1) {
      yearName.push((now - i).toString());
    }
    yearName.sort().forEach((yearValue: string) => {
      total.datasets[0].data.push(years.filter(item => item === yearValue).length);
      const numFeatures = parseInt(yearValue) >= parseInt(lastYearFeatures)
        ? lastNumFeatures
        : yearsFeatures.filter(item => item === yearValue).length;
      total.datasets[1].data.push(numFeatures);
      total.labels.push(yearValue || '');
    });
    total.datasets[0].label.push('Total Tests');
    total.datasets[1].label.push('For New Features');
    total.isLoading = false;
  }
}
