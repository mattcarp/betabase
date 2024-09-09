import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-dialog-warning',
  templateUrl: './dialog-warning.component.html',
  styleUrls: ['./dialog-warning.component.scss'],
})
export class DialogWarningComponent {
  private warning = {
    delete: 'Are you sure you want to delete the current item?',
    auth: 'User not found',
    userDisabled: 'Current user is deactivated. Please contact the support.',
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: 'delete' | 'auth' | 'userDisabled',
    private dialogRef: MatDialogRef<DialogWarningComponent>,
  ) {}

  get message(): string {
    return Object.keys(this.warning).includes(this.data)
      ? this.warning[this.data]
      : this.data;
  }

  onDeleteClick(): void {
    this.dialogRef.close(true);
  }
}
