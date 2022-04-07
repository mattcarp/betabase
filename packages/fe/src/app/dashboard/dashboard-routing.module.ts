import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChooseAppComponent } from './choose-app/choose-app.component';
import { AppDetailsComponent } from './app-details/app-details.component';

const routes: Routes = [
  {
    path: '',
    component: ChooseAppComponent,
  },
  {
    path: ':app/show',
    component: AppDetailsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
