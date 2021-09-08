import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { NgxMatDatetimePickerModule, NgxMatTimepickerModule, NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';

import { RoundListComponent } from './round-list/round-list.component';
import { RoundFormComponent } from './round-form/round-form.component';
import { RoundDetailsComponent } from './round-details/round-details.component';
import { RoundRoutingModule } from './round-routing.module';

@NgModule({
  declarations: [RoundListComponent, RoundFormComponent, RoundDetailsComponent],
  imports: [CommonModule, RoundRoutingModule, AngularEditorModule, FormsModule, MatFormFieldModule, MatSlideToggleModule, NgxMatDatetimePickerModule, NgxMatTimepickerModule, NgxMatNativeDateModule, MatDatepickerModule, ReactiveFormsModule, MatInputModule],
})
export class RoundModule {}
