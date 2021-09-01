import { ErrorHandler, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SentryErrorHandler } from './sentry-error-handler';
import { APP_IS_PLATFORM_BROWSER } from '@shared/providers/is-platform';
import { EnvModule } from '@shared/modules/env/env.module';
import { EnvService } from '@shared/modules/env/env.service';
import { BrowserOptions } from '@sentry/browser';

export function sentryErrorHandlerFactory(
  isBrowser: boolean,
  env: EnvService<{
    SENTRY_URL: string,
    SENTRY_USER: string,
    SENTRY_PROJECT: string,
    SENTRY_ENV: string,
    RELEASE_TAG: string,
  }>,
): ErrorHandler {

  if (!isBrowser) {
    return new ErrorHandler();
  }

  let dsn = env.get('SENTRY_URL');

  if (!dsn && isBrowser && (env.get('SENTRY_USER') && env.get('SENTRY_PROJECT'))) {
    const {protocol, host} = window.location;
    dsn = protocol + '//' + env.get('SENTRY_USER') + '@' + host + '/sentry/' + env.get('SENTRY_PROJECT');
  }

  const config: BrowserOptions = {
    dsn,
    enabled: !!dsn,
    release: env.get('RELEASE_TAG'),
    environment: env.get('SENTRY_ENV'),
  };
  return config.enabled ? new SentryErrorHandler(config) : new ErrorHandler();
}


@NgModule({
  providers: [
    {
      provide: ErrorHandler,
      useFactory: sentryErrorHandlerFactory,
      deps: [
        APP_IS_PLATFORM_BROWSER,
        EnvService,
      ],
    },
  ],
  imports: [
    EnvModule,
    CommonModule,
  ]
})
export class SentryModule {
}
