import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TestRoutingModule } from './test-routing.module';
import { TestFormComponent } from './test-form/test-form.component';
import { TestListComponent } from './test-list/test-list.component';
import { TestDetailsComponent } from './test-details/test-details.component';

@NgModule({
  declarations: [TestFormComponent, TestListComponent, TestDetailsComponent],
  imports: [CommonModule, TestRoutingModule],
})
export class TestModule {}
