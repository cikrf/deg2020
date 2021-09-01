import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BigInteger } from 'big-integer';
import { HttpClient } from '@angular/common/http';
import { pluck, tap } from 'rxjs/operators';
import { ApiResponseBlindSignKeysDto, BlindSignKeysDto } from '@shared/models/portal.models';

@Injectable()
export class BlindSignatureApiService {

  constructor(private readonly httpClient: HttpClient) {
  }

  /**
   * Запрашиваем ключи с бэка
   */
  public getBlindSignaturePublicKey(electionId: string): Observable<{
    modulus: string,
    publicExponent: string,
  }> {
    return this.httpClient.get<{
      data: {
        modulus: string,
        publicExponent: string,
      },
    }>('/api/public/blind-sign/public-key', {
      params: {
        electionId,
      }
    }).pipe(
      pluck('data'),
    );
  }

  public getRSAKeys(): Observable<{ modulus: string, exponent: string }> {
    return this.httpClient.get<any>('/blind-sign/rsa/keys').pipe(
      pluck('data')
    );
  }

  public getMaskedSignature(MaskedMessage: BigInteger): Observable<{ blindSign: string }> {
    return this.httpClient.get<any>('/blind-sign/rsa', {
      params: {
        message: MaskedMessage.toString(16),
      }
    }).pipe(
      pluck('data')
    );
  }

  public verifyRSA(signature: BigInteger, message: string): Observable<boolean> {
    return this.httpClient.post<any>('/blind-sign/rsa', {
      signature: signature.toString(16),
      message
    }).pipe(
      pluck('data')
    );
  }

  /**
   * Создает ослепленную подпись по ключам
   * @param e Ключ подписи
   */
  blindSign(e: string): Observable<string> {
    return this.httpClient.get<any>('/api/crypto-service/blind-sign', {params: {e}}).pipe(
      pluck('data')
    );
  }

  /**
   * Проверяет является ли хешированное сообщение частью ключей
   * @param message Сообщение
   * @param rho _
   * @param omega _
   * @param sigma _
   * @param delta _
   */
  verification(message: string, rho: BigInteger, omega: BigInteger, sigma: BigInteger, delta: BigInteger): Observable<boolean> {
    return this.httpClient.post<any>('/api/crypto-service/blind-sign/verification',
      {
        message,
        rho: rho.toString(16),
        omega: omega.toString(16),
        sigma: sigma.toString(16),
        delta: delta.toString(16)
      }).pipe(pluck('data', 'verified'));
  }
}
