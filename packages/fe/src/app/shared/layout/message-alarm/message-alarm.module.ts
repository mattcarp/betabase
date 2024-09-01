import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageAlarmComponent } from './message-alarm.component';

@NgModule({
  declarations: [MessageAlarmComponent],
  imports: [CommonModule],
  exports: [MessageAlarmComponent]
})
export class MessageAlarmModule { }