import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderModule } from '../header/header.module';
import { MainComponent } from './main.component';

@NgModule({
  declarations: [MainComponent],
  imports: [CommonModule, RouterModule, HeaderModule],
  exports: [MainComponent],
})
export class MainModule {}
