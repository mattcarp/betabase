import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';

import { ScenarioListComponent } from './scenario-list/scenario-list.component';
import { ScenarioDetailsComponent } from './scenario-details/scenario-details.component';
import { ScenarioRoutingModule } from './scenario-routing.module';
import { ScenarioFormComponent } from './scenario-form/scenario-form.component';

@NgModule({
  declarations: [
    ScenarioListComponent,
    ScenarioDetailsComponent,
    ScenarioFormComponent,
  ],
  imports: [
    CommonModule,
    ScenarioRoutingModule,
    FormsModule,
    AngularEditorModule,
  ],
})
export class ScenarioModule {}
