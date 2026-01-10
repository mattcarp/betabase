import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { NgChartsModule } from 'ng2-charts';
import { NgxSliderModule } from '@angular-slider/ngx-slider';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { NavModule } from '../shared/layout/nav/nav.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
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
    NgxSliderModule,
    DashboardRoutingModule,
    NavModule,
    SpinnerModule,
  ],
})
export class DashboardModule {}
