import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { AppListData, ReportData, RoundItem, ScenarioItem, TestItem, VariationItem } from './models';

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
    return firstValueFrom(this.http.get<AppListData>(url));
  }

  getAppReportData(app: string): Promise<ReportData> {
    const url = `${this.apiUrl}/${app}/report-data`;
    return firstValueFrom(this.http.get<ReportData>(url));
  }

  getScenario(id: string): Promise<{ scenario: ScenarioItem; tests: TestItem[], variations: VariationItem[] }> {
    const url = `${this.apiUrl}/scenario/${id}`;
    return firstValueFrom(this.http.get<{ scenario: ScenarioItem; tests: TestItem[], variations: VariationItem[] }>(url));
  }

  getAllScenarios(app: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/scenarios/${app}`;
    return firstValueFrom(this.http.get<ScenarioItem[]>(url));
  }

  addScenario(params: ScenarioItem): Promise<ScenarioItem> {
    const url = `${this.apiUrl}/scenario`;
    return firstValueFrom(this.http.post<ScenarioItem>(url, params));
  }

  updateScenario(params: ScenarioItem): Promise<ScenarioItem> {
    const url = `${this.apiUrl}/scenario/${params.id}`;
    return firstValueFrom(this.http.put<ScenarioItem>(url, params));
  }

  addTest(params: TestItem): Promise<TestItem> {
    const url = `${this.apiUrl}/test`;
    return firstValueFrom(this.http.post<TestItem>(url, params));
  }

  getAllTests(app: string): Promise<TestItem[]> {
    const url = `${this.apiUrl}/tests/${app}`;
    return firstValueFrom(this.http.get<TestItem[]>(url));
  }

  getTest(id: string): Promise<TestItem> {
    const url = `${this.apiUrl}/test/${id}`;
    return firstValueFrom(this.http.get<TestItem>(url));
  }

  updateScenarioOrder(items: ScenarioItem[], type: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/scenario/order`;
    return firstValueFrom(this.http.post<ScenarioItem[]>(url, { items, type }));
  }

  addVariation(scenarioId: number, variationText: string): Promise<TestItem> {
    const url = `${this.apiUrl}/variation`;
    return firstValueFrom(this.http.post<TestItem>(url, { scenarioId, variationText }));
  }

  updateVariation(variation: VariationItem): Promise<VariationItem> {
    const url = `${this.apiUrl}/variation/${variation.id}`;
    return firstValueFrom(this.http.put<VariationItem>(url, variation));
  }

  getAllRounds(app: string): Promise<RoundItem[]> {
    const url = `${this.apiUrl}/rounds/${app}`;
    return firstValueFrom(this.http.get<RoundItem[]>(url));
  }

  getRound(id: string): Promise<RoundItem> {
    const url = `${this.apiUrl}/round/${id}`;
    return firstValueFrom(this.http.get<RoundItem>(url));
  }

  deleteRound(id: number | null = null): Promise<string> {
    const url = `${this.apiUrl}/round/${id}`;
    return firstValueFrom(this.http.delete<string>(url));
  }

  addRound(round: RoundItem): Promise<RoundItem> {
    const url = `${this.apiUrl}/round`;
    return firstValueFrom(this.http.post<RoundItem>(url, round));
  }

  updateRound(round: RoundItem): Promise<RoundItem> {
    const url = `${this.apiUrl}/round/${round.id}`;
    return firstValueFrom(this.http.put<RoundItem>(url, round));
  }

  deleteScenario(id: number | null = null): Promise<string> {
    const url = `${this.apiUrl}/scenario/${id}`;
    return firstValueFrom(this.http.delete<string>(url));
  }
}
