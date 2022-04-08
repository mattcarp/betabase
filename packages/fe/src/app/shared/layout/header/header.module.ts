import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';

import { NavModule } from '../nav/nav.module';
import { HeaderComponent } from './header.component';

@NgModule({
  declarations: [HeaderComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule, NavModule, MatMenuModule, MatExpansionModule, RouterModule],
  exports: [HeaderComponent],
})
export class HeaderModule {}
