import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavModule } from '../shared/layout/nav/nav.module';
import { SupportRoutingModule } from './support-routing.module';
import { SupportComponent } from './support.component';

@NgModule({
  declarations: [SupportComponent],
  imports: [CommonModule, NavModule, SupportRoutingModule],
  exports: [SupportComponent],
})
export class SupportModule {}
