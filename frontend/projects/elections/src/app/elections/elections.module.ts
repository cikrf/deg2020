import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ElectionsService } from './elections.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PreviewComponent } from './preview/preview.component';
import { ListComponent } from './list/list.component';
import { EsiaModule } from '@shared/modules/esia/esia.module';
import { TranslateModule } from '@ngx-translate/core';
import { ModalModule } from '@shared/modal-service/modal.module';
import { ProfileModule } from '../profile/profile.module';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { EsiaGuard } from '@shared/modules/esia-guard/esia-guard.service';
import { EsiaGuardModule } from '@shared/modules/esia-guard/esia-guard.module';
import { EmptyComponent } from './empty/empty.component';
import { ChooseAuthComponent } from './choose-auth/choose-auth.component';
import { RandomNumbersModule } from '@shared/modules/random-numbers/random-numbers.module';
import { WebCryptoModule } from '@shared/modules/web-crypto/web-crypto.module';
import { StartDateModule } from '@shared/pipes/start-date/start-date.module';
import { ItemComponent } from './item/item.component';
import { CandidateModule } from '../shared/candidate/candidate.module';
import { ElectionViewModule } from './election-view/election-view.module';
import { HeaderModule } from '../shared/header/header.module';
import { HeaderLightModule } from '../shared/header-light/header-light.module';
import { TokenComponent } from './token/token.component';

@NgModule({
  declarations: [
    ListComponent,
    PreviewComponent,
    EmptyComponent,
    ChooseAuthComponent,
    ItemComponent,
    TokenComponent,
  ],
  imports: [
    EsiaGuardModule,
    EsiaModule.forRoot({
      authUrl: '/elections/esia-auth',
      redirectUrl: '/elections',
    }),
    RouterModule.forChild([
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'token',
        component: TokenComponent,
      },
      {
        path: 'list',
        component: ListComponent,
        canActivate: [
          EsiaGuard,
        ],
      },
      {
        path: 'list/:status',
        component: ListComponent,
        canActivate: [
          EsiaGuard,
        ],
      },
      {
        path: 'preview/:id',
        component: PreviewComponent,
        canActivate: [
          EsiaGuard,
        ],
        data: {headerType: 'validation'},
      },
      {
        path: 'choose-auth/:id',
        component: ChooseAuthComponent,
        canActivate: [
          EsiaGuard,
        ],
        data: {headerType: 'validation'},
      },
    ]),
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ModalModule,
    ProfileModule,
    TranslateModule,
    SpinnerModule,
    RandomNumbersModule,
    WebCryptoModule,
    StartDateModule,
    CandidateModule,
    ElectionViewModule,
    HeaderModule,
    HeaderLightModule,
  ],
  providers: [
    ElectionsService,
  ],
})
export class ElectionsModule {
}
