import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxEditorModule } from 'ngx-editor';

import { PipesModule } from '../shared/pipes/pipes.module';
import { NavModule } from '../shared/layout/nav/nav.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
import { ScenarioListComponent } from './scenario-list/scenario-list.component';
import { ScenarioDetailsComponent } from './scenario-details/scenario-details.component';
import { ScenarioRoutingModule } from './scenario-routing.module';
import { ScenarioFormComponent } from './scenario-form/scenario-form.component';

@NgModule({
  declarations: [ScenarioListComponent, ScenarioDetailsComponent, ScenarioFormComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatBadgeModule,
    NgxPaginationModule,
    NgxEditorModule,
    PipesModule,
    ScenarioRoutingModule,
    NavModule,
    SpinnerModule,
  ],
})
export class ScenarioModule {}
