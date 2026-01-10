import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';

import { DialogWarningComponent } from './dialog-warning.component';

@NgModule({
  declarations: [DialogWarningComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  exports: [DialogWarningComponent],
})
export class DialogWarningModule {
}
