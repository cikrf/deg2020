import { ModuleWithProviders, NgModule } from '@angular/core';
import { EsiaAuthModule } from '@shared/modules/esia-auth/esia-auth.module';
import { EsiaModule } from '@shared/modules/esia/esia.module';
import { EsiaAuthUrlEbsToken } from '@shared/modules/ebs/ebs.tokens';
import { EsiaGuard } from './esia-guard.service';

@NgModule({
  imports: [
    EsiaAuthModule,
    EsiaModule,
  ],
  providers: [
    EsiaGuard,
  ],
})
export class EsiaGuardModule {
  static forRoot(
    options: Partial<EsiaGuardOptions>,
  ): ModuleWithProviders<EsiaGuardModule> {
    return {
      ngModule: EsiaGuardModule,
      providers: [
        {
          provide: EsiaAuthUrlEbsToken,
          useValue: options.esiaAuthUrl,
        },
      ],
    };
  }
}

export interface EsiaGuardOptions {
  esiaAuthUrl: string;
}
