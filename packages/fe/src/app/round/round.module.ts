import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import {
  NgxMatDatetimePickerModule,
  NgxMatTimepickerModule,
  NgxMatNativeDateModule,
} from '@angular-material-components/datetime-picker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatBadgeModule } from '@angular/material/badge';
import { NgxEditorModule } from 'ngx-editor';

import { RoundRoutingModule } from './round-routing.module';
import { NavModule } from '../shared/layout/nav/nav.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
import { RoundListComponent } from './round-list/round-list.component';
import { RoundFormComponent } from './round-form/round-form.component';
import { RoundDetailsComponent } from './round-details/round-details.component';

@NgModule({
  declarations: [RoundListComponent, RoundFormComponent, RoundDetailsComponent],
  imports: [
    CommonModule,
    RoundRoutingModule,
    NgxEditorModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatBadgeModule,
    NavModule,
    SpinnerModule,
  ],
})
export class RoundModule {}
