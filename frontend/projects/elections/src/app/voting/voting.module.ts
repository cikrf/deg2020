import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectionComponent } from './election/election.component';
import { RouterModule } from '@angular/router';
import { VotingService } from './voting.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ResultModule } from '../shared/result/result.module';
import { TranslateModule } from '@ngx-translate/core';
import { SpinnerModule } from '@shared/components/spinner/spinner.module';
import { BlindSignatureModule } from '@shared/modules/blind-signature/blind-signature.module';
import { ContinueComponent } from './election/continue/continue.component';
import { HeaderLightModule } from '../shared/header-light/header-light.module';

@NgModule({
  declarations: [
    ElectionComponent,
    ContinueComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ResultModule,
    TranslateModule,
    SpinnerModule,
    BlindSignatureModule,
    HeaderLightModule,
  ],
  providers: [
    VotingService,
  ]
})
export class VotingModule {
}
