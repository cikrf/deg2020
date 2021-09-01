import { NgModule } from '@angular/core';
import { ElectionViewComponent } from './election-view.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ElectionViewComponent,
  ],
  exports: [
    ElectionViewComponent,
  ],
  imports: [
    TranslateModule,
    CommonModule,
    ReactiveFormsModule,
  ],
  entryComponents: [
    ElectionViewComponent,
  ]
})
export class ElectionViewModule {

}
