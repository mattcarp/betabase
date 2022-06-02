import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
    return this.warning[this.data];
  }

  onDeleteClick(): void {
    this.dialogRef.close(true);
  }
}
