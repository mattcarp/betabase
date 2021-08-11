import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { filter, pluck, tap } from 'rxjs/operators';

import { PaginationParams, TestItem } from '../../shared/models';
import { AppService } from '../../shared/app.service';

@Component({
  selector: 'app-test-list',
  templateUrl: './test-list.component.html',
  styleUrls: ['./test-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TestListComponent {
  tests: TestItem[] = [];
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
    this.tests = await this.appService.getAllTests(app);
    this.isLoading = false;
  }
}
