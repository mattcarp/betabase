import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  ],
})
export class ScenarioModule {}
