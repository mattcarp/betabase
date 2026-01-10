import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScenarioDetailsComponent } from './scenario-details/scenario-details.component';
import { ScenarioFormComponent } from './scenario-form/scenario-form.component';
import { ScenarioListComponent } from './scenario-list/scenario-list.component';

const routes: Routes = [
  {
    path: ':app/new',
    component: ScenarioFormComponent,
  },
  {
    path: ':app/:id/show',
    component: ScenarioDetailsComponent,
  },
  {
    path: ':app/:id/edit',
    component: ScenarioFormComponent,
  },
  {
    path: ':app',
    component: ScenarioListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScenarioRoutingModule {}
