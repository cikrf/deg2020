import { NgModule } from '@angular/core';
import { LogoModule } from 'projects/elections/src/app/shared/logo/logo.module';
import { CommonModule } from '@angular/common';
import { ResultComponent } from './result.component';

@NgModule({
  declarations: [
    ResultComponent
  ],
  imports: [
    LogoModule,
    CommonModule,
  ],
  exports: [
    ResultComponent,
  ],
})
export class ResultModule {

}
