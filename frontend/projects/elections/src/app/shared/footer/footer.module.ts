import { NgModule } from '@angular/core';
import { FooterComponent } from './footer.component';
import { NavigationModule } from '../navigation/navigation.module';
import { LogoModule } from '../logo/logo.module';
import { CommonModule } from '@angular/common';
import { ModalModule } from '@shared/modal-service/modal.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    FooterComponent,
  ],
  imports: [
    ModalModule,
    NavigationModule,
    LogoModule,
    CommonModule,
    TranslateModule,
  ],
  exports: [
    FooterComponent,
  ],
})
export class FooterModule {

}
