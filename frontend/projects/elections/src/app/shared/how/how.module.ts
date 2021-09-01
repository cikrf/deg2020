import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HowComponent } from './how.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    HowComponent,
  ],
  imports: [
    RouterModule,
    TranslateModule,
  ],
  exports: [
    HowComponent,
  ],
})
export class HowModule {

}
