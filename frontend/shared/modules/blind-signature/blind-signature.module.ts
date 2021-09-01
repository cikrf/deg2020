import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlindSignatureService } from '@shared/modules/blind-signature/blind-signature.service';
import { BlindSignatureApiService } from '@shared/modules/blind-signature/blind-signature-api.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    providers: [BlindSignatureService, BlindSignatureApiService],
    imports: [
        HttpClientModule,
        CommonModule
    ]
})
export class BlindSignatureModule {
}
