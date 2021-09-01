import { NgModule } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';

import { AppModule, HttpLoaderFactory } from './app.module';
import { AppComponent } from './app.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { APP_IS_PLATFORM_BROWSER } from '@shared/providers/is-platform';
import { AppInterceptor } from './app.interceptor';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ServerTransferStateModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, APP_BASE_HREF, APP_IS_PLATFORM_BROWSER],
      },
      defaultLanguage: 'ru',
    }),

  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
