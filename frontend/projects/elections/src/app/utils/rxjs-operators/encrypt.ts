import { OperatorFunction } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import * as JsEncryptModule from 'jsencrypt';
import { fromPromise } from 'rxjs/internal-compatibility';

export function encryptWithPublicKey(publicKey: any, data: any): any {
  const encryptObj = new JsEncryptModule.JSEncrypt();
  encryptObj.setPublicKey(publicKey);
  return encryptObj.encrypt(data);
}

export function generateAesKey(): PromiseLike<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-CBC',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt'],
  );
}

function bytesToBase64(arrayBuffer: ArrayBuffer): string {
  return btoa(bytesToString(arrayBuffer));
}

function base64ToBytes(str: string): ArrayBuffer {
  return stringToBytes(atob(str));
}

function bytesToString(arrayBuffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return byteString;
}

function stringToBytes(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export function encrypt(publicKey?: string): OperatorFunction<string, {encoded: string, key: string, iv: string}> {
  return mergeMap((data: string) => {

    const iv = crypto.getRandomValues(new Uint8Array(16));

    return fromPromise(
      generateAesKey(),
    ).pipe(
      mergeMap((aes: CryptoKey) => fromPromise(crypto.subtle.encrypt(
        {
          name: 'AES-CBC',
          iv,
        },
        aes,
        new TextEncoder().encode(data),
      )).pipe(
        mergeMap((encoded: ArrayBuffer) => {
          return fromPromise(
              crypto.subtle.exportKey('raw', aes),
          ).pipe(
            map((key: ArrayBuffer) => {
              return {
                encoded: bytesToBase64(encoded),
                key: encryptWithPublicKey(publicKey, bytesToBase64(key)),
                iv: encryptWithPublicKey(publicKey, bytesToBase64(iv)),
              };
            }),
          );
        }))
      ),
    );
  });
}
