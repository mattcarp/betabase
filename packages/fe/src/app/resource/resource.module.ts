import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavModule } from '../shared/layout/nav/nav.module';
import { ResourceRoutingModule } from './resource-routing.module';
import { ResourceComponent } from './resource.component';

@NgModule({
  declarations: [ResourceComponent],
  imports: [CommonModule, NavModule, ResourceRoutingModule],
})
export class ResourceModule {}
