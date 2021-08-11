import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { NgxPaginationModule } from 'ngx-pagination';
import { AngularEditorModule } from '@kolkov/angular-editor';

import { NavModule } from '../shared/layout/nav/nav.module';
import { TestRoutingModule } from './test-routing.module';
import { TestFormComponent } from './test-form/test-form.component';
import { TestListComponent } from './test-list/test-list.component';
import { TestDetailsComponent } from './test-details/test-details.component';
import { PipesModule } from '../shared/pipes/pipes.module';

@NgModule({
  declarations: [TestFormComponent, TestListComponent, TestDetailsComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatBadgeModule,
    NgxPaginationModule,
    AngularEditorModule,
    TestRoutingModule,
    NavModule,
    PipesModule,
  ],
})
export class TestModule {}
