import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { EncryptedMessage } from '@shared/models/encryptedMessage';
import { buildSeedHash, destroyGhost, generateKey, initGhost } from '@shared/modules/web-crypto/web-crypto.functions';
import { default as base58 } from './base58.lib';
import { Observable, of } from 'rxjs';

export function normalizeCommonJSImport<T>(
  importPromise: Promise<T>,
): Promise<T> {
  // CommonJS's `module.exports` is wrapped as `default` in ESModule.
  return importPromise.then((m: any) => (m.default || m) as T);
}

@Injectable()
export class WebCryptoService {

  private crypto: Crypto & any;

  constructor() {
  }

  private keyAlgorithm = 'GOST R 34.11-PBKDF2';
  private encryptAlgorithm = 'GOST 28147-CFB';
  private signAlgorithm = 'GOST R 34.11-HMAC';
  private derivedKeyType = 'GOST 28147';

  private async cryptoInit(): Promise<Crypto & any> {
    if (!this.crypto) {
      this.crypto = await normalizeCommonJSImport(
        import(/* webpackChunkName: "chart" */ 'gost-crypto'),
      );
    }
    return this.crypto;
  }

  async gostEncrypt(
    content: any, password: string = this.createPassword(), salt: Uint8Array = this.createSalt()
  ): Promise<EncryptedMessage> {
    await this.cryptoInit();
    // if (!salt) {
    //   salt = this.createSalt();
    // }
    const passwordKey = await this.crypto.subtle.importKey('raw', this.crypto.coding.Chars.decode(password, 'utf8'),
      this.keyAlgorithm, true, ['deriveKey']);
    const CEK = await this.crypto.subtle.deriveKey({
        salt,
        name: this.keyAlgorithm,
        iterations: 1000,
      },
      passwordKey,
      this.derivedKeyType,
      true,
      ['encrypt', 'sign'],
    );
    const data = await this.crypto.subtle.encrypt(this.encryptAlgorithm, CEK, this.crypto.coding.Chars.decode(content, 'utf8'));
    // const sign = await this.crypto.subtle.sign(this.signAlgorithm, CEK, data);
    return {
      message: this.crypto.coding.Base64.encode(data),
      password,
      salt,
      // sign: this.crypto.coding.Hex.encode(sign)
    };
  }

  async createRandom(length: number = 256): Promise<Uint8Array> {
    await this.cryptoInit();
    const random = new Uint8Array(length);
    this.crypto.getRandomValues(random);
    return random;
  }

  async createSeed(seedBytes: Uint8Array): Promise<SeedBytes> {
    await initGhost();

    const seedHash = buildSeedHash(seedBytes);
    const keys = generateKey(seedHash);
    const publicKey = new Uint8Array(keys.publicKey);
    const privateKey = new Uint8Array(keys.privateKey);

    destroyGhost();
    return {
      privateKey: base58.encode(privateKey),
      publicKey: base58.encode(publicKey),
    };
  }

  createPassword(): string {
    return uuidv4();
  }

  createSalt(): Uint8Array {
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);
    return salt;
    // return this.crypto.coding.Hex.encode(salt);
  }

  async gostDecrypt<T = any>(content: any, password: string, salt: Uint8Array, sign?: string): Promise<T> {
    await this.cryptoInit();
    let message = '';
    try {
      const passwordKey = await this.crypto.subtle.importKey('raw', this.crypto.coding.Chars.decode(password, 'utf8'),
        this.keyAlgorithm, true, ['deriveKey']);
      const CEK = await this.crypto.subtle.deriveKey({
          name: this.keyAlgorithm,
          salt,
          iterations: 1000
        }, passwordKey,
        this.derivedKeyType, true, ['decrypt', 'verify']);
      // const HMAC = this.crypto.coding.Hex.decode(sign);
      const source = this.crypto.coding.Base64.decode(content);
      // const check = await this.crypto.subtle.verify(this.signAlgorithm, CEK, HMAC, source);
      // if (check) {
      message = await this.crypto.subtle.decrypt(this.encryptAlgorithm, CEK, source);
      message = this.crypto.coding.Chars.encode(message, 'utf8');
    } catch (e) {
      console.error(e);
    }
    // } else {
    //   throw new Error('Подпись не валидна');
    // }
    return JSON.parse(message) as T;
  }
}

export interface SeedBytes {
  readonly privateKey: string;
  readonly publicKey: string;
}
