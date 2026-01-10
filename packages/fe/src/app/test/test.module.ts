import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxEditorModule } from 'ngx-editor';

import { NavModule } from '../shared/layout/nav/nav.module';
import { TestRoutingModule } from './test-routing.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
import { PipesModule } from '../shared/pipes/pipes.module';
import { DialogWarningModule } from '../shared/layout/dialog-warning/dialog-warning.module';
import { TestFormComponent } from './test-form/test-form.component';
import { TestListComponent } from './test-list/test-list.component';
import { TestDetailsComponent } from './test-details/test-details.component';

@NgModule({
  declarations: [
    TestFormComponent,
    TestListComponent,
    TestDetailsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
    MatDialogModule,
    NgxPaginationModule,
    NgxEditorModule,
    TestRoutingModule,
    NavModule,
    PipesModule,
    SpinnerModule,
    DialogWarningModule,
  ],
})
export class TestModule {}
