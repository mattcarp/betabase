import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { NgxPaginationModule } from 'ngx-pagination';

import { TicketListComponent } from './ticket-list/ticket-list.component';
import { TicketRoutingModule } from './ticket-routing.module';
import { NavModule } from '../shared/layout/nav/nav.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
import { PipesModule } from '../shared/pipes/pipes.module';
import { TicketFormComponent } from './ticket-form/ticket-form.component';

@NgModule({
  declarations: [TicketListComponent, TicketFormComponent],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    NgxPaginationModule,
    TicketRoutingModule,
    NavModule,
    SpinnerModule,
    PipesModule,
  ],
})
export class TicketModule {
}
