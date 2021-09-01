import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NglFormElementComponent } from './ngl-form-element/ngl-form-element.component';

@NgModule({
  declarations: [NglFormElementComponent],
  exports: [NglFormElementComponent],
  imports: [
    CommonModule
  ]
})
export class NglFormModule {
}
