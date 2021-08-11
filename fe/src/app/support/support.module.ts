import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

import { NavModule } from '../shared/layout/nav/nav.module';
import { SupportRoutingModule } from './support-routing.module';
import { SupportComponent } from './support.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  declarations: [SupportComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    NavModule,
    SupportRoutingModule,
    MatChipsModule,
    MatCheckboxModule,
  ],
  exports: [SupportComponent],
})
export class SupportModule {}
