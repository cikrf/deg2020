import { NgModule } from '@angular/core';
import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { appBaseHrefProvider } from '@shared/providers/app-base-href';
import { appPostDataProvider } from '@shared/providers/post-data';
import { APP_IS_PLATFORM_BROWSER, appIsPlatformBrowserProvider } from '@shared/providers/is-platform';
import { BlindSignatureModule } from '@shared/modules/blind-signature/blind-signature.module';
import { BlockchainService } from './blockchain/blockchain.service';
import { WebCryptoModule } from '@shared/modules/web-crypto/web-crypto.module';
import { ResultModule } from './result/result.module';
import { ElectionComponent } from './voting/election/election.component';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { VotingService } from './voting/voting.service';
import { ModalService } from '@shared/modal-service/modal.service';
import { HeaderComponent } from './header/header.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { AppInterceptor } from './app.interceptor';
import { DisableModalComponent } from './disable-modal/disable-modal.component';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { SentryModule } from '@shared/modules/sentry/sentry.module';
import { EnvModule } from '@shared/modules/env/env.module';
import { BallotTimerPipe } from '@shared/pipes/ballotTimer/ballot-timer.pipe';
import { BulletinModule } from '@shared/components/bulletin/bulletin.module';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({appId: 'voting-box'}),
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot([
      {
        path: ':id',
        pathMatch: 'full',
        component: ElectionComponent,
      },
    ]),
    BrowserTransferStateModule,
    CommonModule,
    ReactiveFormsModule,
    BlindSignatureModule,
    WebCryptoModule,
    ResultModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, APP_BASE_HREF, APP_IS_PLATFORM_BROWSER],
      },
      defaultLanguage: 'ru',
    }),
    EnvModule,
    SentryModule,
    FormsModule,
    SpinnerModule,
    BulletinModule,
  ],
  declarations: [
    AppComponent,
    ElectionComponent,
    HeaderComponent,
    ConfirmModalComponent,
    DisableModalComponent,
    BallotTimerPipe,
  ],
  providers: [
    appBaseHrefProvider,
    appPostDataProvider,
    appIsPlatformBrowserProvider,
    VotingService,
    ModalService,
    BlockchainService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}

export function HttpLoaderFactory(http: HttpClient, baseHref: string, isBrowser: boolean): TranslateLoader {
  return new TranslateHttpLoader(http, (isBrowser ? baseHref : '') + 'assets/locale/', '.json');
}
