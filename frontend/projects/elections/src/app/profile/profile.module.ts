import { NgModule } from '@angular/core';
import { ProfileComponent } from './profile.component';
import { HttpClientModule } from '@angular/common/http';
import { ProfileWidgetComponent } from './profile-widget/profile-widget.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileService } from './profile.service';
import { LangModalComponent } from './lang-modal/lang-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from '@shared/modal-service/modal.module';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { EsiaAuthModule } from '@shared/modules/esia-auth/esia-auth.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    ProfileComponent,
    ProfileWidgetComponent,
    LangModalComponent,
  ],
  imports: [
    HttpClientModule,
    RouterModule.forChild([
      {
        path: 'profile',
        pathMatch: 'full',
        component: ProfileComponent,
      },
    ]),
    CommonModule,
    ModalModule,
    FormsModule,
    ReactiveFormsModule,
    SpinnerModule,
    EsiaAuthModule,
    TranslateModule,
  ],
  providers: [
    ProfileService,
  ],
  entryComponents: [
    LangModalComponent,
  ],
  exports: [
    ProfileWidgetComponent,
  ],
})
export class ProfileModule {

}
