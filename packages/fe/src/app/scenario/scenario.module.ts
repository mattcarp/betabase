import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { NgxPaginationModule } from 'ngx-pagination';
import { AngularEditorModule } from '@kolkov/angular-editor';

import { PipesModule } from '../shared/pipes/pipes.module';
import { NavModule } from '../shared/layout/nav/nav.module';
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
    AngularEditorModule,
    PipesModule,
    ScenarioRoutingModule,
    NavModule,
  ]
})
export class ScenarioModule {}
