import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LabelType } from '@angular-slider/ngx-slider';
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
  isPrioritiesChecked = false;
  isRegressionsChecked = false;
  draggedItems = {
    enhancementScenarios: false,
    priorityScenarios: false,
    regressionScenarios: false,
  };
  chartDisplayOptions = detailsChartOptions;
  isMonthsMode = false;
  yearsUnique: string[] = [];

  private allTests: TestItem[] = [];
  private yearsAllTests: string[] = [];
  private isDaysMode = false;

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
    return !!!Object.keys(this.reportData || {})?.length;
  }

  get roundStart(): string {
    if (!this.reportData?.roundNotes?.startsAt) {
      return '';
    }
    return this.getDateAsMoment(this.reportData?.roundNotes?.startsAt).add(-5, 'h').format('MMM Do');
  }

  get roundEnd(): string {
    if (!this.reportData?.roundNotes?.endsAt) {
      return '';
    }
    return this.getDateAsMoment(this.reportData?.roundNotes?.endsAt).add(-5, 'h').format('MMM Do');
  }

  get forTesting(): number {
    return Number(this.reportData?.enhancementCount) + Number(this.reportData?.regressionCount);
  }

  get daysLeft(): number {
    if (!this.reportData?.roundNotes?.endsAt) {
      return 0;
    }
    const daysLeft = this.getDateAsMoment(this.reportData?.roundNotes?.endsAt).diff(moment(), 'days');
    return daysLeft < 0 ? 0 : daysLeft;
  }

  get percentRemain(): string {
    let msRemaining = this.getDateAsMoment(this.reportData?.roundNotes?.endsAt).diff(moment());
    if (msRemaining < 0) {
      msRemaining = 0;
    }
    const durationMs = this.getDateAsMoment(this.reportData?.roundNotes?.endsAt).diff(this.getDateAsMoment(this.reportData?.roundNotes?.startsAt));
    let percentRemain = msRemaining / durationMs || 0;
    percentRemain = Math.round(percentRemain * 100);
    if (percentRemain > 100) {
      percentRemain = 100;
    }
    return `${percentRemain}%`;
  }

  get releaseDate(): string {
    if (!this.reportData?.roundNotes?.releaseDate || String(this.reportData?.roundNotes?.releaseDate) === '0000-00-00 00:00:00') {
      return this.getDateAsMoment(this.reportData?.roundNotes?.endsAt).add(-5, 'h').format('ddd, MMM Do');
    }
    return this.getDateAsMoment(this.reportData?.roundNotes?.releaseDate).add(-5, 'h').format('ddd, MMM Do');
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
      enhancementRatio = testedCount ? testedCount / totalCount : 1;
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

  getPassedItemsQuantity(scenarioItems: ScenarioItem[] = []): number {
    const items = scenarioItems.filter(({ lastTest }) => lastTest === 'Pass') || [];
    return items?.length;
  }

  getItemsByStatus(items: ScenarioItem[] = [], showFailed: boolean): ScenarioItem[] {
    return showFailed
      ? items.filter(({ lastTest }) => lastTest === 'Fail')
      : items;
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

  async yearSliderEvent(): Promise<void> {
    const start = this.yearsUnique.indexOf(String(this.chartDisplayOptions.yearSlider.value));
    const end = this.yearsUnique.indexOf(String(this.chartDisplayOptions.yearSlider.highValue));
    this.isMonthsMode = end - start === 0;
    if (this.isMonthsMode) {
      await this.fetchDataTotalCharts(this.getValuesMonth(), this.getKeysMonth());
    } else {
      await this.fetchDataTotalCharts(this.yearsUnique.slice(start, end + 1));
      this.chartDisplayOptions.monthSlider.value = 0;
      this.chartDisplayOptions.monthSlider.highValue = 11;
    }
  }

  async monthSliderEvent(): Promise<void> {
    const start = this.chartDisplayOptions.monthSlider.value;
    const end = this.chartDisplayOptions.monthSlider.highValue;
    this.isDaysMode = end - start === 0;
    if (this.isDaysMode) {
      const days = [...Array(31).keys()].slice(1).map(String);
      await this.fetchDataTotalCharts(days);
    } else {
      await this.fetchDataTotalCharts(this.getValuesMonth().slice(start, end + 1), this.getKeysMonth().slice(start, end + 1));
    }
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
    await this.setReportData(app);
    // Data for Charts
    this.allTests = await this.appService.getAllTests(this.app);
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
    // - Browser
    const browsers = this.allTests.map(({ browserName }) => browserName).sort();
    const browserName = [...new Set(browsers)];
    const browser = this.chartDisplayOptions.browser;
    browser.datasets[0].data = [];
    browser.labels = [];
    const backgroundColor: string[] = [];
    const hoverBackgroundColor: string[] = [];
    browserName.forEach((item: string | undefined, index: number) => {
      browser.datasets[0].data.push(browsers.filter(browser => browser === item).length);
      browser.labels.push(item || '');
      switch (item) {
        case 'Chrome':
          backgroundColor.push('#9ada9d');
          hoverBackgroundColor.push('#57c04b');
          break;
        case 'Firefox':
          backgroundColor.push('#ffa4b6');
          hoverBackgroundColor.push('#ff6384');
          break;
        case 'Safari':
          backgroundColor.push('#ffe29f');
          hoverBackgroundColor.push('#ffcd56');
          break;
        case 'Android Browser':
          backgroundColor.push('#86c7f3');
          hoverBackgroundColor.push('#36a1eb');
          break;
        case 'Internet Explorer':
          backgroundColor.push('#eeeff1');
          hoverBackgroundColor.push('#d7dae0');
          break;
        case 'Microsoft Edge':
          backgroundColor.push('#cda4ff');
          hoverBackgroundColor.push('#a163ff');
          break;
        default:
          backgroundColor.push('#ffeaa4');
          hoverBackgroundColor.push('#ffe063');
          break;
      }
    });
    browser.datasets[0].backgroundColor = backgroundColor;
    browser.datasets[0].hoverBackgroundColor = hoverBackgroundColor;
    browser.datasets[0].hoverBorderColor = 'rgba(0, 0, 0, 0.1)';
    browser.datasets[0].label = 'value';
    browser.isLoading = false;

    // ngx-slider
    this.yearsAllTests = this.allTests.map((test: TestItem) => this.getDateAsMoment(test.createdAt).format('YYYY')).sort();
    this.yearsUnique = [...new Set(this.yearsAllTests)];
    if (this.yearsUnique.length > 1) {
      const now = new Date().getFullYear();
      now ? this.yearsUnique.splice(-1) : null;
      const lastYear = parseInt(this.yearsUnique[this.yearsUnique.length - 1]);
      for (let i = 0; i < now - lastYear; i += 1) {
        this.yearsUnique.push((now - i).toString());
      }
      this.yearsUnique.sort();
      await this.fetchDataTotalCharts(this.yearsUnique);
    } else {
      this.isMonthsMode = true;
      await this.fetchDataTotalCharts(this.getValuesMonth(), this.getKeysMonth());
    }
    this.setYearSlider({
      years: this.yearsUnique,
      value: this.yearsUnique[0],
      highValue: this.yearsUnique[this.yearsUnique.length - 1],
    });
    this.setMonthSlider({
      value: 0,
      highValue: 11,
    });
  }

  private async fetchDataTotalCharts(xAxisName: string[], keyMonths: string[] = []): Promise<void> {
    let data0: string[] = [];
    let data1: string[] = [];
    let labels: string[] = [];

    if (this.isMonthsMode && this.yearsUnique.length) {
      const year = String(this.chartDisplayOptions.yearSlider.highValue || new Date().getFullYear());
      const result = this.allTests
        .map((test: TestItem) => this.getDateAsMoment(test.createdAt).format('YYYY-MM'))
        .sort()
        .filter((item: string) => item.includes(year))
        .map((item: string) => item.replace(`${year}-`, ''));
      const diff: string[] = [];
      result.forEach((item: string) => {
        if (keyMonths.includes(item)) {
          diff.push(item);
        }
      });
      xAxisName.forEach((name: string) => {
        const month: { key: string; value: string }[] = this.chartDisplayOptions.months.filter(({ value }) => value === name);
        data0.push(String(diff.filter((key: string) => key === month[0].key).length));
        labels.push(name);
      });

      if (this.isDaysMode) {
        data0 = [];
        labels = [];
        const year = String(this.chartDisplayOptions.yearSlider.highValue);
        let month = String(this.chartDisplayOptions.monthSlider.highValue + 1);
        month = Number(month) < 10 ? `0${month}` : month;
        const result = this.allTests
          .map((test: TestItem) => this.getDateAsMoment(test.createdAt).format('YYYY-MM-DD'))
          .sort()
          .filter((item: string) => item.includes(year))
          .filter((item: string) => item.includes(`-${month}-`))
          .map((item: string) => item.replace(`${year}-${month}-`, ''));
        xAxisName.forEach((day: string) => {
          data0.push(String(result.filter(item => item === day).length));
          labels.push(day);
        });
      }

      this.chartDisplayOptions.total = {
        isLoading: false,
        type: 'line',
        title: 'Total Tests',
        datasets: [
          {
            data: data0,
            label: ['Total Tests'],
            tension: 0.5,
            fill: 'start',
          },
        ],
        labels: labels,
      };
    } else if (this.yearsUnique.length) {
      // -- For new features
      const yearsFeatures = this.reportData?.enhancementScenarios
        ?.map((item: ScenarioItem) => this.getDateAsMoment(item.mostRecent).format('YYYY')).sort();
      const yearFeaturesName = [...new Set(yearsFeatures)];
      const lastYearFeatures = yearFeaturesName[yearFeaturesName.length - 1];
      const lastNumFeatures = yearsFeatures?.filter(item => item === lastYearFeatures).length;

      xAxisName.forEach((value: string) => {
        data0.push(String(this.yearsAllTests.filter(item => item === value).length));
        const numFeatures = parseInt(value) >= parseInt(lastYearFeatures)
          ? lastNumFeatures
          : yearsFeatures?.filter(item => item === value).length;
        data1.push(String(numFeatures));
        labels.push(value);
      });

      this.chartDisplayOptions.total = {
        isLoading: false,
        type: 'line',
        title: 'Total Tests',
        datasets: [
          {
            data: data0,
            label: ['Total Tests'],
            tension: 0.5,
            fill: 'start',
          },
          {
            data: data1,
            label: ['For New Features'],
            tension: 0.5,
          },
        ],
        labels: labels,
      };
    } else {
      this.chartDisplayOptions.total = {
        isLoading: false,
        type: 'line',
        title: 'Total Tests',
        datasets: [
          {
            data: [],
            label: ['Total Tests'],
            tension: 0.5,
            fill: 'start',
          },
          {
            data: [],
            label: ['For New Features'],
            tension: 0.5,
          },
        ],
        labels: labels,
      };
    }
  }

  private setYearSlider(yearData: any): void {
    // Example -- https://www.npmjs.com/package/@angular-slider/ngx-slider
    const yearSlider = this.chartDisplayOptions.yearSlider;
    const years = yearData.years;
    yearSlider.options = {
      floor: Number(years[0]),
      ceil: Number(years[years.length - 1]),
      step: 1,
      showTicks: true,
    };
    yearSlider.value = yearData.value;
    yearSlider.highValue = yearData.highValue;
  }

  private setMonthSlider(monthData: { value: number, highValue: number }): void {
    const monthSlider = this.chartDisplayOptions.monthSlider;
    monthSlider.options = {
      floor: 0,
      ceil: 11,
      step: 1,
      showTicks: true,
      translate: (value: number, label: LabelType): string => {
        switch (label) {
          case LabelType.Low:
            return this.getValuesMonth()[value];
          case LabelType.High:
            return this.getValuesMonth()[value];
          default:
            return this.getValuesMonth()[value];
        }
      }
    };
    monthSlider.value = monthData.value;
    monthSlider.highValue = monthData.highValue;
  }

  private getKeysMonth(): string[] {
    return this.chartDisplayOptions.months.map(({ key }) => key);
  }

  private getValuesMonth(): string[] {
    return this.chartDisplayOptions.months.map(({ value }) => value);
  }

  private getDateAsMoment(dateString: Date | string | undefined): moment.Moment {
    return moment(String(dateString), 'YYYY-MM-DD');
  }

  private async setReportData(app: string): Promise<void> {
    this.reportData = {};
    const roundNotes = await this.appService.getRoundNotes(app);
    this.reportData.roundNotes = roundNotes;
    const { startsAt, endsAt } = roundNotes;
    const startDate = moment(startsAt).format('YYYY-MM-DD');
    const endDate = moment(endsAt).format('YYYY-MM-DD');
    const reportData = this.reportData as any;
    const appService = this.appService as any;
    const setPropValue = async (propName: string, methodName: string, params: string[]) => {
      reportData[propName] = await appService[methodName](...params);
      if (propName === 'enhancementScenarios') {
        reportData.enhancementCount = reportData.enhancementScenarios?.length;
      }
      if (propName === 'regressionScenarios') {
        reportData.regressionCount = reportData.regressionScenarios?.length;
      }
      if (propName === 'priorities') {
        reportData.priorityCount = reportData.priorities?.length;
      }
      if (propName === 'flaggedScenarios') {
        reportData.flaggedCount = reportData.flaggedScenarios?.length;
      }
      this.reportDataInitial = JSON.parse(JSON.stringify(reportData));
    };
    [
      { propName: 'deployment', methodName: 'getDeployment', requestParams: [app] },
      { propName: 'enhancementScenarios', methodName: 'getEnhancementScenarios', requestParams: [app, startDate, endDate] },
      { propName: 'regressionScenarios', methodName: 'getRegressionScenarios', requestParams: [app, startDate, endDate] },
      { propName: 'priorities', methodName: 'getPriorities', requestParams: [app, startDate, endDate] },
      { propName: 'testsToday', methodName: 'getTestCountRange', requestParams: [app, 'today'] },
      { propName: 'testsYesterday', methodName: 'getTestCountRange', requestParams: [app, 'yesterday'] },
      { propName: 'testsThisWeek', methodName: 'getTestCountRange', requestParams: [app, 'last7days'] },
      { propName: 'jiras', methodName: 'getJiras', requestParams: [app, startDate] },
      { propName: 'testCount', methodName: 'getTestCount', requestParams: [app, startDate, endDate] },
      { propName: 'flaggedScenarios', methodName: 'getFlaggedScenarios', requestParams: [app, startDate, endDate] },
    ].forEach(({ propName, methodName, requestParams }) => {
      setPropValue(propName, methodName, requestParams);
    });
  }
}
