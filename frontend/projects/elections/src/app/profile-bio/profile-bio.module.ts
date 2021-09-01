import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalModule } from '@shared/modal-service/modal.module';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { EsiaAuthModule } from '@shared/modules/esia-auth/esia-auth.module';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileBioComponent } from './profile-bio.component';
import { EbsModule } from '@shared/modules/ebs/ebs.module';
import { AuthenticationGuard } from '../voting/authentication.guard';
import { EsiaAuthUrlEsiaToken } from '@shared/modules/esia/esia.tokens';
import { TOKEN_SERVICE, TokenResolver } from '@shared/utils/token-resolver';
import { EbsAuthService } from '@shared/modules/ebs/ebs.service';
import { EsiaGuard } from '@shared/modules/esia-guard/esia-guard.service';

@NgModule({
  declarations: [
    ProfileBioComponent,
  ],
  imports: [
    HttpClientModule,
    RouterModule.forChild([
      {
        path: 'index',
        component: ProfileBioComponent,
        canActivate: [
          EsiaGuard,
        ],
      }
    ]),
    EbsModule.forRoot({
      esiaAuthUrl: '/profile-bio/ebs-esia-auth',
      redirectUrl: '/profile-bio/ebs-auth',
    }),
    CommonModule,
    ModalModule,
    FormsModule,
    ReactiveFormsModule,
    SpinnerModule,
    EsiaAuthModule,
    TranslateModule,
  ],
  providers: [
    AuthenticationGuard,
    {
      provide: EsiaAuthUrlEsiaToken,
      useValue: '/profile-bio/esia-auth',
    },
    TokenResolver,
    {
      provide: TOKEN_SERVICE,
      useExisting: EbsAuthService,
    },
  ],
})
export class ProfileBioModule {

}
