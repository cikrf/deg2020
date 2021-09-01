import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsiaGuardModule } from 'shared/modules/esia-guard/esia-guard.module';
import { EbsModule } from 'shared/modules/ebs/ebs.module';
import { RouterModule } from '@angular/router';
import { ElectionComponent } from 'projects/elections/src/app/voting/election/election.component';
import { EsiaGuard } from 'shared/modules/esia-guard/esia-guard.service';
import { VotingModule } from 'projects/elections/src/app/voting/voting.module';
import { EsiaAuthUrlEsiaToken } from 'shared/modules/esia/esia.tokens';
import { TOKEN_PARAM_NAME, TOKEN_SERVICE, TokenResolver } from '@shared/utils/token-resolver';
import { EbsAuthService } from '@shared/modules/ebs/ebs.service';
import { AuthenticationGuard } from '../voting/authentication.guard';

@NgModule({
  imports: [
    CommonModule,
    VotingModule,
    EsiaGuardModule,
    EbsModule.forRoot({
      esiaAuthUrl: '/vote/ebs-esia-auth',
      redirectUrl: '/vote/ebs-auth',
    }),
    RouterModule.forChild([
      {
        path: ':id',
        component: ElectionComponent,
        canActivate: [
          EsiaGuard,
        ],
        data: {headerType: 'cipher'},
        resolve: {
          token: TokenResolver,
        },
      },
    ]),
  ],
  providers: [
    AuthenticationGuard,
    {
      provide: EsiaAuthUrlEsiaToken,
      useValue: '/elections/esia-auth',
    },
    TokenResolver,
    {
      provide: TOKEN_SERVICE,
      useExisting: EbsAuthService,
    },
    {
      provide: TOKEN_PARAM_NAME,
      useValue: 'tb',
    },
  ],
})
export class EbsVoteModule {
}
