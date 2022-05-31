import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainComponent } from './shared/layout/main/main.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { AdminGuard } from './auth/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/sign-in',
    pathMatch: 'full',
  },
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
      },
    ],
  },
  {
    path: 'dashboard',
    component: MainComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'scenario',
    component: MainComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./scenario/scenario.module').then((m) => m.ScenarioModule),
  },
  {
    path: 'test',
    component: MainComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./test/test.module').then((m) => m.TestModule),
  },
  {
    path: 'round',
    component: MainComponent,
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./round/round.module').then((m) => m.RoundModule),
  },
  // From Nav navigation:
  {
    path: 'support',
    component: MainComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./support/support.module').then((m) => m.SupportModule),
  },
  {
    path: 'resources',
    component: MainComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./resource/resource.module').then((m) => m.ResourceModule),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: '**',
    redirectTo: '/auth/sign-in',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false, anchorScrolling: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
