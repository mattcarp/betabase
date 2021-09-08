import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoundFormComponent } from './round-form/round-form.component';
import { RoundDetailsComponent } from './round-details/round-details.component';
import { RoundListComponent } from './round-list/round-list.component';

const routes: Routes = [
  {
    path: ':app/new',
    component: RoundFormComponent,
  },
  {
    path: ':app/:id/show',
    component: RoundDetailsComponent,
  },
  {
    path: ':app/:id/edit',
    component: RoundFormComponent,
  },
  {
    path: ':app',
    component: RoundListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoundRoutingModule {}
