import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxEditorModule } from 'ngx-editor';

import { NavModule } from '../shared/layout/nav/nav.module';
import { TestRoutingModule } from './test-routing.module';
import { SpinnerModule } from '../shared/layout/spinner/spinner.module';
import { PipesModule } from '../shared/pipes/pipes.module';
import { TestFormComponent } from './test-form/test-form.component';
import { TestListComponent } from './test-list/test-list.component';
import { TestDetailsComponent } from './test-details/test-details.component';
import { DialogWarningComponent } from '../shared/layout/dialog-warning/dialog-warning.component';

@NgModule({
  declarations: [
    TestFormComponent,
    TestListComponent,
    TestDetailsComponent,
    DialogWarningComponent,
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
  ],
})
export class TestModule {}
