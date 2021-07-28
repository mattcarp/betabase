import { Component, OnInit } from '@angular/core';

import { DashboardService } from '../dashboard.service';
import { AppListData } from '../models';

@Component({
  selector: 'app-choose-app',
  templateUrl: './choose-app.component.html',
  styleUrls: ['./choose-app.component.scss'],
})
export class ChooseAppComponent implements OnInit {
  data: AppListData | null = null;

  constructor(private dashboardService: DashboardService) {}

  get isLoading(): boolean {
    return this.data === null;
  }

  async ngOnInit(): Promise<void> {
    this.data = await this.dashboardService.getAppListData();
  }
}
