import { ModuleWithProviders, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { EbsAuthService } from './ebs.service';
import { EbsRedirectUrlToken, EsiaAuthUrlEbsToken } from './ebs.tokens';
import { EbsComponent } from './ebs.component';
import { EbsEsiaComponent } from './ebs-esia.component';
import { EbsInterceptor } from './ebs.interceptor';
import { RouterModule } from '@angular/router';
import { EsiaGuard } from '@shared/modules/esia-guard/esia-guard.service';
import { EsiaAuthModule } from '@shared/modules/esia-auth/esia-auth.module';
import { EsiaGuardModule } from '@shared/modules/esia-guard/esia-guard.module';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';

@NgModule({
  declarations: [
    EbsComponent,
    EbsEsiaComponent,
  ],
  imports: [
    HttpClientModule,
    EsiaAuthModule,
    EsiaGuardModule,
    RouterModule.forChild([
      {
        path: 'ebs-esia-auth',
        component: EbsEsiaComponent,
        pathMatch: 'prefix',
        canActivate: [
          EsiaGuard,
        ],
        data: {headerType: 'validation'},
      },
      {
        path: 'ebs-auth',
        component: EbsComponent,
        pathMatch: 'prefix',
        canActivate: [
          EsiaGuard,
        ],
        data: {headerType: 'validation'},
      }
    ]),
    SpinnerModule,
  ],
  providers: [
    EbsAuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EbsInterceptor,
      multi: true,
    },
  ],
})
export class EbsModule {
  static forRoot(
    options: Partial<EbsOptions>,
  ): ModuleWithProviders<EbsModule> {
    return {
      ngModule: EbsModule,
      providers: [
        {
          provide: EsiaAuthUrlEbsToken,
          useValue: options.esiaAuthUrl,
        },
        {
          provide: EbsRedirectUrlToken,
          useValue: options.redirectUrl,
        },
      ],
    };
  }
}

export interface EbsOptions {
  redirectUrl: string;
  esiaAuthUrl: string;
}
