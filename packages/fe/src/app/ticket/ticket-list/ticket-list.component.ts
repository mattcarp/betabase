import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';

import { AppService } from '../../shared/app.service';
import { PaginationParams, TicketItem } from '../../shared/models';

interface SortItem {
  [key: string]: any;
}

@Component({
  selector: 'app-ticket-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TicketListComponent implements OnInit {
  isLoading = false;
  tickets: TicketItem[] = [];
  pageSize = 50;
  listOptions = [50, 100, 250];
  paginationParams: PaginationParams = {
    searchTerm: '',
    page: 1,
    sortField: 'date',
    sortDirection: 'DESC',
  };

  constructor(private appService: AppService, private router: Router) {
  }

  get sortedTickets(): TicketItem[] {
    return this.tickets
      .filter((item: TicketItem) => {
        return this.paginationParams.searchTerm?.length
          ? item.description?.toLowerCase().includes(this.paginationParams.searchTerm)
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

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.tickets = await this.appService.getZendeskTickets();
    this.isLoading = false;
  }

  async onDetailsClick(id: number): Promise<void> {
    await this.router.navigate(['/ticket', id]);
  }
}
