import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderLightComponent } from './header-light.component';
import { ProfileModule } from '../../profile/profile.module';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [HeaderLightComponent],
  exports: [
    HeaderLightComponent
  ],
  imports: [
    CommonModule,
    ProfileModule,
    TranslateModule
  ]
})
export class HeaderLightModule {
}
