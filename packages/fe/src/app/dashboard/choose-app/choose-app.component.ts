import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';

import { AppService } from '../../shared/app.service';
import { AppListData } from '../../shared/models';
import { detailsChartOptions } from '../app-details/app-details.constants';

@Component({
  selector: 'app-choose-app',
  templateUrl: './choose-app.component.html',
  styleUrls: ['./choose-app.component.scss'],
  host: { '[class.page]': 'true' },
})
export class ChooseAppComponent implements OnInit {
  data: AppListData | null = null;

  constructor(private appService: AppService, private router: Router) {}

  get isLoading(): boolean {
    return this.data === null;
  }

  async ngOnInit(): Promise<void> {
    const chartDisplayOptions = detailsChartOptions;
    chartDisplayOptions.completion.isLoading = true;
    chartDisplayOptions.browser.isLoading = true;
    chartDisplayOptions.total.isLoading = true;
    this.data = {};
    ['Partner Previewer', 'AOMA', 'Promo', 'Promo Admin', 'DX'].forEach((appName: string) => {
      ['getScenarioCount', 'getAppRoundNotes', 'getTestCount', 'getFailCount'].forEach((methodName: string) => {
        this.setPropValue(appName, methodName);
      });
    });
  }

  private async setPropValue(appName: string, methodName: string): Promise<void> {
    let propName = '';
    let propValue;
    let prefix = appName
      .split(' ')
      .map((word: string, index: number) => {
        return index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.substring(1);
      })
      .join('');
    switch (methodName) {
      case 'getScenarioCount':
        propName = `${prefix}Scenarios`;
        propValue = await this.appService.getScenarioCount(appName);
        break;
      case 'getAppRoundNotes':
        propName = `${prefix}Round`;
        propValue = await this.appService.getRoundNotes(appName);
        break;
      case 'getTestCount':
        propName = `${prefix}TestCount`;
        propValue = await this.appService.getTestCount(appName);
        break;
      case 'getFailCount':
        propName = `${prefix}Fails`;
        propValue = await this.appService.getFailCount(appName);
        break;
    }
    this.data = { ...this.data, [propName]: propValue };
  }

  async onButtonClick(page: string): Promise<void> {
    await this.router.navigate([`${page}`]);
  }

  getFormattedDate(dateString: Date | string | undefined): string {
    if (!dateString) { return ''; }
    return moment(String(dateString), 'YYYY-MM-DD').format('LL');
  }
}
