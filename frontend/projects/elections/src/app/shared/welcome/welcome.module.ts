import { NgModule } from '@angular/core';
import { WelcomeComponent } from './welcome.component';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    WelcomeComponent,
  ],
  imports: [
    RouterModule,
    TranslateModule,
  ],
  exports: [
    WelcomeComponent,
  ]
})
export class WelcomeModule {

}
