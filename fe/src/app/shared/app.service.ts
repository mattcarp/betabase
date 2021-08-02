import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AppListData, ReportData, ScenarioItem, TestItem } from './models';

@Injectable({
  providedIn: 'root',
})
export class AppService {
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

  getScenario(id: string): Promise<{ scenario: ScenarioItem, tests: TestItem[] }> {
    const url = `${this.apiUrl}/scenario/${id}`;
    return this.http.get<{ scenario: ScenarioItem, tests: TestItem[] }>(url).toPromise();
  }

  getAllScenarios(app: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/scenario-list/${app}`;
    return this.http.get<ScenarioItem[]>(url).toPromise();
  }
}
