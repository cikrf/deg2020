import { NgModule } from '@angular/core';
import { SlideShowComponent } from '@shared/components/slide-show/slide-show.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    SlideShowComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SlideShowComponent
  ]
})
export class SlideShowModule {
  
}
