import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { filter, pluck } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { PaginationParams, ScenarioItem, TestItem } from '../../shared/models';

@Component({
  selector: 'app-scenario-details',
  templateUrl: './scenario-details.component.html',
  styleUrls: ['./scenario-details.component.scss'],
  host: { '[class.page]': 'true' },
})
export class ScenarioDetailsComponent {
  app: string | null = null;
  scenario: ScenarioItem | null = null;
  tests: TestItem[] = [];
  isShowInput = false;
  variationsFormData = '';
  pageSize = 10;
  listOptions = [10, 25, 50];
  paginationParams: PaginationParams = {
    searchTerm: '',
    page: 1,
    sortField: 'date',
    sortDirection: 'DESC',
  };

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'id' in params),
        pluck('id'),
      )
      .subscribe((id: string) => this.fetchData(id));
  }

  onEditMaserCaseClick(appTest: string | undefined, scenarioId: number | undefined): void {
    this.router.navigate([`/scenario/${appTest}/${scenarioId}/edit`]);
  }

  onAddVariationClick(): void {
    this.isShowInput = !this.isShowInput;
  }

  onCancelVariationClick(): void {
    this.isShowInput = !this.isShowInput;
  }

  onSaveVariationClick(): void {
    this.isShowInput = !this.isShowInput;
  }

  onNewTestClick(app: string = '', id: number = 0): void {
    this.router.navigate([`/test/${app}/${id}/new`]);
  }

  getClassSortField(controlName: string): string {
    return controlName === this.paginationParams.sortField ? 'active' : '';
  }

  getClassDirection(): string {
    return this.paginationParams.sortDirection || '';
  }

  onSearchStart(searchTerm: string = ''): void {
    this.paginationParams.searchTerm = searchTerm;
  }

  async onToggleSort(controlName: string): Promise<void> {
    this.paginationParams.page = 1;
    this.paginationParams.sortField = controlName;
    if (this.paginationParams.sortDirection === 'ASC') {
      this.paginationParams.sortDirection = 'DESC';
    } else {
      this.paginationParams.sortDirection = 'ASC';
    }
    // TODO: Sort
    // this.loadTests(this.paginationParams.searchTerm);
  }

  private async fetchData(id: string): Promise<void> {
    const { scenario, tests } = await this.appService.getScenario(id);
    this.scenario = scenario;
    this.tests = tests;
  }
}
