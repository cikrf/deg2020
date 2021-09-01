import { NgModule } from '@angular/core';
import { LogoComponent } from './logo.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    LogoComponent,
  ],
  imports: [
    RouterModule,
    TranslateModule,
    CommonModule,
  ],
  exports: [
    LogoComponent,
  ]
})
export class LogoModule {

}
