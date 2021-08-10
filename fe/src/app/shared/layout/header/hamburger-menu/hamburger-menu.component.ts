import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { DialogFaqComponent } from '../dialog-faq/dialog-faq.component';
import { DialogContactUsComponent } from '../dialog-contact-us/dialog-contact-us.component';

@Component({
  selector: 'app-hamburger-menu',
  templateUrl: './hamburger-menu.component.html',
  styleUrls: ['./hamburger-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HamburgerMenuComponent {
  activePage = '';
  isMenuOpen = false;

  constructor(public dialog: MatDialog) {}

  menuOpened(): void {
    this.isMenuOpen = true;
  }

  menuClosed(): void {
    this.isMenuOpen = false;
  }

  openDialogFaq(): void {
    this.dialog.open(DialogFaqComponent, {
      width: '800px',
      autoFocus: false,
    });
  }

  openDialogContactUs(): void {
    this.dialog.open(DialogContactUsComponent, {
      width: '400px',
      autoFocus: false,
    });
  }
}
