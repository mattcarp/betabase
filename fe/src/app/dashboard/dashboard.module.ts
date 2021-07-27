import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { ChooseAppComponent } from './choose-app/choose-app.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { AppDetailsComponent } from './app-details/app-details.component';

@NgModule({
  declarations: [
    ChooseAppComponent,
    AppDetailsComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    DashboardRoutingModule,
  ],
})
export class DashboardModule {}
