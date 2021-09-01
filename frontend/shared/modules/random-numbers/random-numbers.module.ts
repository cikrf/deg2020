import { NgModule } from '@angular/core';
import { RandomNumbersComponent } from './random-numbers.component';
import { ResultModule } from '../../../projects/elections/src/app/shared/result/result.module';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RandomNumbersService } from '@shared/modules/random-numbers/random-numbers.service';
import { RandomNumbersSmileComponent } from '@shared/modules/random-numbers/random-numbers-smile/random-numbers-smile.component';

@NgModule({
  declarations: [
    RandomNumbersComponent,
    RandomNumbersSmileComponent,
  ],
  exports: [
    RandomNumbersComponent,
    RandomNumbersSmileComponent,
  ],
  imports: [
    ResultModule,
    CommonModule,
    TranslateModule,
  ],
  providers: [
    RandomNumbersService,
  ]
})
export class RandomNumbersModule {

}
