import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VotingModule } from 'projects/elections/src/app/voting/voting.module';
import { EsiaGuardModule } from 'shared/modules/esia-guard/esia-guard.module';
import { RouterModule } from '@angular/router';
import { ElectionComponent } from 'projects/elections/src/app/voting/election/election.component';
import { EsiaGuard } from 'shared/modules/esia-guard/esia-guard.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SmsAuthInterceptor } from 'projects/elections/src/app/simple-vote/sms-auth.interceptor';
import { SmsAuthComponent } from './sms-auth/sms-auth.component';
import { EsiaModule } from '@shared/modules/esia/esia.module';
import { SmsAuthService } from 'projects/elections/src/app/simple-vote/sms-auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { ResultModule } from '../shared/result/result.module';
import { TranslateModule } from '@ngx-translate/core';
import { TokenResolver } from '@shared/utils/token-resolver';
import { AuthenticationGuard } from '../voting/authentication.guard';
import { NumericModule } from '@shared/directives/numeric/numeric.module';
import { HeaderLightModule } from '../shared/header-light/header-light.module';


@NgModule({
  declarations: [
    SmsAuthComponent,
  ],
  imports: [
    CommonModule,
    VotingModule,
    EsiaGuardModule,
    EsiaModule.forRoot({
      authUrl: '/elections/esia-auth',
      redirectUrl: '/elections',
    }),
    RouterModule.forChild([
      {
        path: 'auth',
        component: SmsAuthComponent,
        canActivate: [EsiaGuard],
        data: {headerType: 'validation'},
      },
      {
        path: ':id',
        component: ElectionComponent,
        canActivate: [
          EsiaGuard,
          // AuthenticationGuard,
        ],
        data: {headerType: 'cipher'},
        resolve: {
          token: TokenResolver,
        },
      },
    ]),
    ReactiveFormsModule,
    SpinnerModule,
    ResultModule,
    TranslateModule,
    NumericModule,
    HeaderLightModule,
  ],
  providers: [
    AuthenticationGuard,
    SmsAuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SmsAuthInterceptor,
      multi: true,
    },
  ],
})
export class SimpleVoteModule {
}
