import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { APP_BASE_HREF, CommonModule, registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { appBaseHrefProvider } from '@shared/providers/app-base-href';
import { HomeComponent } from './home/home.component';
import { HeaderModule } from './shared/header/header.module';
import { FooterModule } from './shared/footer/footer.module';
import { BannerComponent } from './landing-page/banner/banner.component';
import { TitleComponent } from './landing-page/title/title.component';
import { InformerComponent } from './landing-page/informer/informer.component';
import { TimerComponent } from './landing-page/timer/timer.component';
import { LocationComponent } from './landing-page/location/location.component';
import { WhenComponent } from './landing-page/when/when.component';
import { TermsComponent } from './landing-page/terms/terms.component';
import { StepsComponent } from './landing-page/steps/steps.component';
import { QuestionAnswerComponent } from './landing-page/question-answer/question-answer.component';
import { MoreQuestionComponent } from './landing-page/more-question/more-question.component';
import { PopupComponent } from './landing-page/location/popup/popup.component';
import { ResultModule } from './shared/result/result.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ProfileModule } from './profile/profile.module';
import { EsiaModule } from '@shared/modules/esia/esia.module';
import { EsiaGuardModule } from '@shared/modules/esia-guard/esia-guard.module';
import { LocalStorage } from './local-storage';
import { AboutComponent } from './about/about.component';
import { NewsComponent } from './news/news.component';
import { VotePreventGuard } from './vote-prevent.guard';
import { DoneModule } from './done/done.module';
import { RandomNumbersModule } from '@shared/modules/random-numbers/random-numbers.module';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { WebCryptoModule } from '@shared/modules/web-crypto/web-crypto.module';
import { TOKEN_SERVICE, TokenResolver } from '@shared/utils/token-resolver';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';
import { SentryModule } from '@shared/modules/sentry/sentry.module';
import { appIsPlatformBrowserProvider } from '@shared/providers/is-platform';
import { ModalService } from '@shared/modal-service/modal.service';
import { EnvModule } from '@shared/modules/env/env.module';
import { ErrorModule } from './error/error.module';
import { HowModule } from 'projects/elections/src/app/shared/how/how.module';
import { WelcomeModule } from 'projects/elections/src/app/shared/welcome/welcome.module';
import { CandidateModule } from './shared/candidate/candidate.module';

registerLocaleData(ru);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AboutComponent,
    NewsComponent,
    BannerComponent,
    TitleComponent,
    TimerComponent,
    LocationComponent,
    StepsComponent,
    QuestionAnswerComponent,
    MoreQuestionComponent,
    PopupComponent,
    InformerComponent,
    WhenComponent,
    TermsComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HeaderModule,
    FooterModule,
    ResultModule,
    ProfileModule,
    DoneModule,
    EsiaGuardModule,
    EsiaModule.forRoot({
      authUrl: '/esia-auth',
      redirectUrl: '/',
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient, APP_BASE_HREF],
      },
      defaultLanguage: 'ru',
    }),
    RandomNumbersModule,
    SpinnerModule,
    WebCryptoModule,
    EnvModule,
    SentryModule,
    ErrorModule,
    HowModule,
    WelcomeModule,
    CandidateModule,
  ],
  providers: [
    appIsPlatformBrowserProvider,
    {
      provide: LOCALE_ID,
      useValue: 'ru',
    },
    LocalStorage,
    appBaseHrefProvider,
    VotePreventGuard,
    ModalService,
    TokenResolver,
    {
      provide: TOKEN_SERVICE,
      useExisting: EsiaAuthService,
    },
    // AuthEsiaService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}

export function HttpLoaderFactory(http: HttpClient, baseHref: string): TranslateLoader {
  return new TranslateHttpLoader(http, baseHref + 'assets/locale/', '.json');
}
