import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';

import { NavModule } from '../nav/nav.module';
import { HeaderComponent } from './header.component';
import { HamburgerMenuComponent } from './hamburger-menu/hamburger-menu.component';
import { DialogFaqComponent } from './dialog-faq/dialog-faq.component';
import { DialogContactUsComponent } from './dialog-contact-us/dialog-contact-us.component';

@NgModule({
  declarations: [HeaderComponent, HamburgerMenuComponent, DialogFaqComponent, DialogContactUsComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule, NavModule, MatMenuModule, MatExpansionModule, RouterModule],
  exports: [HeaderComponent, HamburgerMenuComponent],
  entryComponents: [DialogFaqComponent, DialogContactUsComponent],
})
export class HeaderModule {}
