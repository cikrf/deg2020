import { NgModule } from '@angular/core';
import { HeaderComponent } from './header.component';
import { NavigationModule } from '../navigation/navigation.module';
import { LogoModule } from '../logo/logo.module';
import { CommonModule } from '@angular/common';
import { ProfileModule } from '../../profile/profile.module';
import { ModalModule } from '@shared/modal-service/modal.module';
import { RouterModule } from '@angular/router';
import { MobileMenuComponent } from './mobile-menu/mobile-menu.component';

@NgModule({
  declarations: [
    HeaderComponent,
    MobileMenuComponent,
  ],
  imports: [
    ModalModule,
    NavigationModule,
    LogoModule,
    CommonModule,
    ProfileModule,
    RouterModule,
  ],
  exports: [
    HeaderComponent,
  ],
})
export class HeaderModule {

}
