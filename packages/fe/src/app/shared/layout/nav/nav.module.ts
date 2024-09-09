import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { RouterModule } from '@angular/router';

import { NavComponent } from './nav.component';
import { SelectUtilityComponent } from './select-utility/select-utility.component';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';

@NgModule({
  declarations: [NavComponent, SelectUtilityComponent],
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, RouterModule, MatMenuModule],
  exports: [NavComponent],
})
export class NavModule {}
