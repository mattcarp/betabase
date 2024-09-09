import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatExpansionModule } from '@angular/material/expansion';

import { NavModule } from '../nav/nav.module';
import { HeaderComponent } from './header.component';

@NgModule({
  declarations: [HeaderComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule, NavModule, MatMenuModule, MatExpansionModule, RouterModule],
  exports: [HeaderComponent],
})
export class HeaderModule {}
