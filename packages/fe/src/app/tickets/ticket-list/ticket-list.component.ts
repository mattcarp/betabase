import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AppService } from '../../shared/app.service';
import { TicketItem } from '../../shared/models';

@Component({
  selector: 'thebetabase-list',
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
  host: { '[class.page]': 'true' },
})
export class TicketListComponent implements OnInit {
  isLoading = false;
  displayedColumns: string[] = ['id', 'status', 'subject', 'createdAt', 'updatedAt'];
  tickets: TicketItem[] = [];

  constructor(private appService: AppService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.tickets = await this.appService.getZendeskTickets();
    this.isLoading = false;
  }

  async onDetailsClick(id: number): Promise<void> {
    await this.router.navigate(['/tickets', id]);
  }
}
