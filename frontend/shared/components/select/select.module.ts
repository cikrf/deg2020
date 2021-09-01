import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectComponent } from './select.component';
import { NglComboboxesModule } from 'ng-lightning';



@NgModule({
  declarations: [SelectComponent],
  exports: [SelectComponent],
  imports: [
    CommonModule,
    NglComboboxesModule
  ]
})
export class SelectModule { }
