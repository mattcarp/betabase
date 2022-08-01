import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { JiraItem, ReportData, RoundItem, ScenarioItem, TestItem, VariationItem } from './models';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiUrl;
  }

  get today(): string {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    return `${yyyy}-${mm}-${dd}`;
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

  updateTest(params: TestItem): Promise<TestItem> {
    const url = `${this.apiUrl}/test/${params.id}`;
    return firstValueFrom(this.http.put<TestItem>(url, params));
  }

  getAllTests(app: string): Promise<TestItem[]> {
    const url = `${this.apiUrl}/tests/${app}`;
    return firstValueFrom(this.http.get<TestItem[]>(url));
  }

  getTest(id: string): Promise<TestItem> {
    const url = `${this.apiUrl}/test/${id}`;
    return firstValueFrom(this.http.get<TestItem>(url));
  }

  deleteTest(id: number | null = null): Promise<string> {
    const url = `${this.apiUrl}/test/${id}`;
    return firstValueFrom(this.http.delete<string>(url));
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

  getScenarioCount(app: string): Promise<{ scenarioCount: number }> {
    const url = `${this.apiUrl}/get-scenario-count/${app}`;
    return firstValueFrom(this.http.get<{ scenarioCount: number }>(url));
  }

  getRoundNotes(app: string): Promise<RoundItem> {
    const url = `${this.apiUrl}/get-round-notes/${app}`;
    return firstValueFrom(this.http.get<RoundItem>(url));
  }

  getTestCount(app: string, startsAt?: string, endsAt?: string): Promise<number> {
    let url = `${this.apiUrl}/get-test-count/${app}`;
    if (!!startsAt?.length && !!endsAt?.length) {
      url += `?startsAt=${startsAt}&endsAt=${endsAt}`;
    }
    return firstValueFrom(this.http.get<number>(url));
  }

  getFailCount(app: string): Promise<number> {
    const url = `${this.apiUrl}/get-fail-count/${app}`;
    return firstValueFrom(this.http.get<number>(url));
  }

  async downloadPdf(params: { app: string, scenarioIds: number[] }): Promise<void> {
    const url = `${this.apiUrl}/pdf`;
    const pdfAsBase64String = await firstValueFrom(this.http.post<string>(url, params));
    const downloadLink = document.createElement('a');
    downloadLink.href = `data:application/pdf;base64,${pdfAsBase64String}`;
    downloadLink.download = `All Cases ${this.today} ${params.app}.pdf`;
    downloadLink.click();
    downloadLink.remove();
  }

  getDeployment(app: string): Promise<ReportData> {
    const url = `${this.apiUrl}/get-deployment/${app}`;
    return firstValueFrom(this.http.get<ReportData>(url));
  }

  getEnhancementScenarios(app: string, startsAt: string, endsAt: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/enhancement-scenarios/${app}?startsAt=${startsAt}&endsAt=${endsAt}`;
    return firstValueFrom(this.http.get<ScenarioItem[]>(url));
  }

  getRegressionScenarios(app: string, startsAt: string, endsAt: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/regression-scenarios/${app}?startsAt=${startsAt}&endsAt=${endsAt}`;
    return firstValueFrom(this.http.get<ScenarioItem[]>(url));
  }

  getPriorities(app: string, startsAt: string, endsAt: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/priorities/${app}?startsAt=${startsAt}&endsAt=${endsAt}`;
    return firstValueFrom(this.http.get<ScenarioItem[]>(url));
  }

  getTestCountRange(app: string, period: string): Promise<number> {
    const url = `${this.apiUrl}/test-count-range/${app}?period=${period}`;
    return firstValueFrom(this.http.get<number>(url));
  }

  getJiras(app: string, startsAt: string): Promise<JiraItem[]> {
    const url = `${this.apiUrl}/jiras/${app}?startsAt=${startsAt}`;
    return firstValueFrom(this.http.get<JiraItem[]>(url));
  }

  getFlaggedScenarios(app: string, startsAt: string, endsAt: string): Promise<ScenarioItem[]> {
    const url = `${this.apiUrl}/flagged-scenarios/${app}?startsAt=${startsAt}&endsAt=${endsAt}`;
    return firstValueFrom(this.http.get<ScenarioItem[]>(url));
  }

  sendSms(params: { telNumbers: string[]; message: string; }): Promise<boolean> {
    const url = `${this.apiUrl}/sms`;
    return firstValueFrom(this.http.post<boolean>(url, params));
  }
}
