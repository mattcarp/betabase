import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';
import * as moment from 'moment';

import { AppService } from '../../shared/app.service';
import { PaginationParams, ScenarioItem } from '../../shared/models';

interface SortItem {
  [key: string]: any;
}

@Component({
  selector: 'app-scenario-list',
  templateUrl: './scenario-list.component.html',
  styleUrls: ['./scenario-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class ScenarioListComponent {
  scenarios: ScenarioItem[] = [];
  app: string | null = null;
  isLoading = false;
  pageSize = 50;
  listOptions = [50, 100, 250];
  paginationParams: PaginationParams = {
    searchTerm: '',
    page: 1,
    sortField: 'date',
    sortDirection: 'DESC',
  };

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
        tap((app: string) => this.app = app),
      )
      .subscribe((app: string) => this.fetchData(app));
  }

  get sortedScenarios(): ScenarioItem[] {
    return this.scenarios
      .filter((item: ScenarioItem) => {
        return this.paginationParams.searchTerm?.length
          ? item.name?.includes(this.paginationParams.searchTerm)
          : true;
      })
      .sort((a: SortItem, b: SortItem) => {
        const sortField = this.paginationParams.sortField as string;
        const ascOrder = this.paginationParams.sortDirection === 'ASC';
        let aValue = a[sortField];
        let bValue = b[sortField];
        if (['createdAt', 'updatedAt'].includes(sortField)) {
          aValue = moment(aValue).valueOf();
          bValue = moment(bValue).valueOf();
        }
        return typeof aValue === 'string'
          ? ascOrder ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
          : ascOrder ? bValue - aValue : aValue - bValue;
      });
  }

  get currentPage(): number {
    return Number(this.paginationParams.page || 0);
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

  async onToggleSort(sortField: string): Promise<void> {
    this.paginationParams.page = 1;
    this.paginationParams.sortField = sortField;
    if (this.paginationParams.sortDirection === 'ASC') {
      this.paginationParams.sortDirection = 'DESC';
    } else {
      this.paginationParams.sortDirection = 'ASC';
    }
  }

  async onDeleteClick(scenarioItem: ScenarioItem): Promise<void> {
    await this.appService.deleteScenario(scenarioItem?.id);
    await this.fetchData(scenarioItem?.appUnderTest);
  }

  private async fetchData(app: string): Promise<void> {
    this.isLoading = true;
    this.scenarios = await this.appService.getAllScenarios(app);
    this.isLoading = false;
  }
}
