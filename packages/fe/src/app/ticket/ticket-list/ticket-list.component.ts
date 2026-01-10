import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AppService } from '../../shared/app.service';
import { PaginationParams, TicketItem } from '../../shared/models';

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TicketListComponent implements OnInit {
  isLoading = false;
  tickets: TicketItem[] = [];
  listOptions = [50, 100, 250];
  requestParams: PaginationParams = {
    searchTerm: '',
    page: 1,
    limit: this.listOptions?.[0],
    total: 0,
    sortField: 'createdAt',
    sortDirection: 'DESC',
  };

  constructor(private appService: AppService, private router: Router) {}

  get paginationParams(): { currentPage: number; itemsPerPage: number; totalItems: number; } {
    return {
      currentPage: this.requestParams.page!,
      itemsPerPage: this.requestParams.limit!,
      totalItems: this.requestParams.total!,
    };
  }

  getClassSortField(controlName: string): string {
    return controlName === this.requestParams.sortField ? 'active' : '';
  }

  getClassDirection(): string {
    return this.requestParams.sortDirection || '';
  }

  async onSearchStart(searchTerm: string = ''): Promise<void> {
    this.requestParams.searchTerm = searchTerm;
    await this.fetchData();
  }

  async onToggleSort(sortField: string): Promise<void> {
    this.requestParams.page = 1;
    this.requestParams.sortField = sortField;
    if (this.requestParams.sortDirection === 'ASC') {
      this.requestParams.sortDirection = 'DESC';
    } else {
      this.requestParams.sortDirection = 'ASC';
    }
    await this.fetchData();
  }

  async ngOnInit(): Promise<void> {
    await this.fetchData();
  }

  async onDetailsClick(id: number): Promise<void> {
    await this.router.navigate(['/ticket', id]);
  }

  async onPageChange(page: number): Promise<void> {
    this.requestParams.page = page;
    await this.fetchData();
  }

  async onShowQuantityChange(quantity: number): Promise<void> {
    this.requestParams.limit = quantity;
    await this.fetchData();
  }

  private async fetchData(): Promise<void> {
    this.isLoading = true;
    const { tickets, count } = await this.appService.getZendeskTickets(this.requestParams);
    this.tickets = tickets;
    this.requestParams.total = count;
    this.isLoading = false;
  }
}
