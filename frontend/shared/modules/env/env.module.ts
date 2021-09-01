import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnvServiceProvider } from './env-service.provider';

@NgModule({
  providers: [
    EnvServiceProvider,
  ],
  imports: [
    CommonModule,
  ],
})
export class EnvModule {
  constructor(@Optional() @SkipSelf() already?: EnvModule,) {
    if (already) {
      throw new Error(
        'EnvModule is already loaded. Import it in the AppModule only');
    }
  }
}
