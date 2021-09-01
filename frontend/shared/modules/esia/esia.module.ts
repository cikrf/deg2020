import { ModuleWithProviders, NgModule } from '@angular/core';
import { EsiaComponent } from './esia.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { EsiaInterceptor } from './esia.interceptor';
import { EsiaAuthUrlEsiaToken, EsiaResultRedirectUrlToken } from './esia.tokens';
import { RouterModule } from '@angular/router';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: 'esia-auth',
        component: EsiaComponent,
        pathMatch: 'prefix',
        data: {headerType: 'validation'},
      },
    ]),
    SpinnerModule,
  ],
  declarations: [
    EsiaComponent,
  ],
})
export class EsiaModule {
  static forRoot(
    options: Partial<EsiaOptions>,
  ): ModuleWithProviders<EsiaModule> {
    return {
      ngModule: EsiaModule,
      providers: [
        {
          provide: EsiaResultRedirectUrlToken,
          useValue: options.redirectUrl,
        },
        {
          provide: EsiaAuthUrlEsiaToken,
          useValue: options.authUrl,
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: EsiaInterceptor,
          multi: true,
        },
      ],
    };
  }
}

export interface EsiaOptions {
  redirectUrl: string;
  authUrl: string;
}
