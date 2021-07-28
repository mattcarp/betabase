import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AppListData, ReportData } from './models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  getAppListData(): Promise<AppListData> {
    const url = `${this.apiUrl}/app-list-data`;
    return this.http.get<AppListData>(url).toPromise();
  }

  getAppReportData(app: string): Promise<ReportData> {
    const url = `${this.apiUrl}/${app}/report-data`;
    return this.http.get<ReportData>(url).toPromise();
  }
}
