import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebCryptoService } from '@shared/modules/web-crypto/web-crypto.service';

@NgModule({
  providers: [WebCryptoService],
  imports: [
    CommonModule
  ]
})
export class WebCryptoModule {
}
