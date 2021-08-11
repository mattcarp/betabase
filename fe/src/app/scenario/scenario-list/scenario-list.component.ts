import { Component } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';

import { AppService } from '../../shared/app.service';
import { PaginationParams, ScenarioItem } from '../../shared/models';

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

  constructor(private appService: AppService, private activatedRoute: ActivatedRoute, private router: Router) {
    activatedRoute.params
      .pipe(
        filter((params: Params) => 'app' in params),
        pluck('app'),
        tap((app: string) => {
          this.app = app;
        }),
      )
      .subscribe((app: string) => this.fetchData(app));
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

  private async fetchData(app: string): Promise<void> {
    this.isLoading = true;
    this.scenarios = await this.appService.getAllScenarios(app);
    this.isLoading = false;
  }
}
