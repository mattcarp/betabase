import { Component, OnInit } from '@angular/core';

import { DashboardService } from '../dashboard.service';

@Component({
  selector: 'app-choose-app',
  templateUrl: './choose-app.component.html',
  styleUrls: ['./choose-app.component.scss'],
})
export class ChooseAppComponent implements OnInit {
  data: any;

  constructor(private dashboardService: DashboardService) {}

  async ngOnInit(): Promise<void> {
    this.data = await this.dashboardService.getAppListData().toPromise();
    console.log(this.data);
  }
}
