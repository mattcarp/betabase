import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { NgChartsModule } from 'ng2-charts';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { NavModule } from '../shared/layout/nav/nav.module';
import { ChooseAppComponent } from './choose-app/choose-app.component';
import { AppDetailsComponent } from './app-details/app-details.component';
import { ChartComponent } from './app-details/chart/chart.component';

@NgModule({
  declarations: [
    ChooseAppComponent,
    AppDetailsComponent,
    ChartComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatCardModule,
    MatButtonModule,
    MatBadgeModule,
    NgChartsModule,
    DashboardRoutingModule,
    NavModule,
  ],
})
export class DashboardModule {}
