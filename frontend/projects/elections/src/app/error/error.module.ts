import { NgModule } from '@angular/core';
import { ErrorComponent } from './error.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ResultModule } from '../shared/result/result.module';

@NgModule({
  imports: [
    TranslateModule,
    RouterModule.forRoot([
      {
        path: 'error/:section',
        component: ErrorComponent,
      },
    ]),
    CommonModule,
    ResultModule,
  ],
  declarations: [
    ErrorComponent,
  ],
  exports: [
    ErrorComponent,
  ],
})
export class ErrorModule {

}
