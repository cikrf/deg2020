import { NgModule } from '@angular/core';
import { EsiaAuthService } from './esia-auth.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    HttpClientModule,
  ],
  providers: [
    EsiaAuthService,
  ]
})
export class EsiaAuthModule {

}
