import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputComponent } from './input.component';
import { NglInputModule } from 'ng-lightning';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [InputComponent],
  exports: [InputComponent],
  imports: [
    CommonModule,
    NglInputModule,
    FormsModule
  ]
})
export class InputModule { }
