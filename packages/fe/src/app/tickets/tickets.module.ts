import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';

import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketsRoutingModule } from './tickets-routing.module';
import { NavModule } from '../shared/layout/nav/nav.module';

@NgModule({
  declarations: [TicketListComponent],
  imports: [CommonModule, HttpClientModule, TicketsRoutingModule, MatTableModule, NavModule],
})
export class TicketsModule {}
