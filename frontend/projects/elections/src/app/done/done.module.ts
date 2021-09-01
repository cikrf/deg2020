import { NgModule } from '@angular/core';
import { DoneComponent } from './done.component';
import { TranslateModule } from '@ngx-translate/core';
import { ResultModule } from '../shared/result/result.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    DoneComponent,
  ],
  imports: [
    TranslateModule,
    ResultModule,
    RouterModule
  ]
})
export class DoneModule {}
