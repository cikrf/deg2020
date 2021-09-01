import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StartDatePipe } from './start-date.pipe';

@NgModule({
  declarations: [StartDatePipe],
  imports: [
    CommonModule
  ],
  exports: [StartDatePipe]
})
export class StartDateModule { }
