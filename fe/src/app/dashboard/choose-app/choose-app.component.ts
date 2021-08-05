import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AppService } from '../../shared/app.service';
import { AppListData } from '../../shared/models';

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
    this.data = await this.appService.getAppListData();
  }

  onButtonClick(page: string): void {
    this.router.navigate([`${page}`]);
  }
}
