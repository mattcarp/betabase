import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestFormComponent } from './test-form/test-form.component';
import { TestListComponent } from './test-list/test-list.component';
import { TestDetailsComponent } from './test-details/test-details.component';

const routes: Routes = [
  {
    path: ':app/new',
    component: TestFormComponent,
  },
  {
    path: ':app/:id/show',
    component: TestDetailsComponent,
  },
  {
    path: ':app/:id/edit',
    component: TestFormComponent,
  },
  {
    path: ':app/:scenarioId/new',
    component: TestFormComponent,
  },
  {
    path: ':app',
    component: TestListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TestRoutingModule {}
