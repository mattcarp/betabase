import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { NotificationDialogComponent } from './notification-dialog.component';

@NgModule({
  declarations: [NotificationDialogComponent],
  imports: [CommonModule, MatIconModule],
  exports: [NotificationDialogComponent],
})
export class NotificationDialogModule {}
