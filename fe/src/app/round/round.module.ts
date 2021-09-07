import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';

import { RoundListComponent } from './round-list/round-list.component';
import { RoundFormComponent } from './round-form/round-form.component';
import { RoundDetailsComponent } from './round-details/round-details.component';
import { RoundRoutingModule } from './round-routing.module';

@NgModule({
  declarations: [RoundListComponent, RoundFormComponent, RoundDetailsComponent],
  imports: [CommonModule, RoundRoutingModule, AngularEditorModule, FormsModule],
})
export class RoundModule {}
