import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';

import { NavComponent } from './nav.component';
import { SelectUtilityComponent } from './select-utility/select-utility.component';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({
  declarations: [NavComponent, SelectUtilityComponent],
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterModule, MatMenuModule],
  exports: [NavComponent],
})
export class NavModule {}
