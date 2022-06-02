import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { DialogWarningComponent } from './dialog-warning.component';

@NgModule({
  declarations: [DialogWarningComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  exports: [DialogWarningComponent],
})
export class DialogWarningModule {
}
