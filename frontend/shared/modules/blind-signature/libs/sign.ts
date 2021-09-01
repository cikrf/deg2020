/* tslint:disable:variable-name typedef no-bitwise */
import { BigInteger } from 'big-integer';
import { ECGostParams, EcKeyPair, Gost, GOST_CURVE_34_10_2012, GOST_R_34_10 } from './gost';
import { ModPoint } from './ec-math/modpoint';
import { ModCurve } from './ec-math/curve';
import { forkJoin, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BlindSignatureService } from '@shared/modules/blind-signature/blind-signature.service';
import * as bigInt from 'big-integer';

const ecp = ECGostParams[GOST_CURVE_34_10_2012.X_256_A];
const curve = new ModCurve(ecp.a, ecp.b, ecp.p, ecp.x, ecp.y);

export class GostEc {
  protected _algType: GOST_R_34_10;
  protected _curveType: GOST_CURVE_34_10_2012;
  protected _privateKeys: BigInteger[];

  protected _gostSign: any;
  protected _algorithm: any;
  /** Эллиптическая кривая. */
  protected _curve: ModCurve;
  protected _p: BigInteger;
  protected _q: BigInteger;
  /** Начальная точка кривой. Задаётся параметрами алгоритма. */
  protected _G: ModPoint;

  /** Список пар закрытый-открытый ключ */
  protected _keyPairs: EcKeyPair[] = [];

  protected constructor(algType: GOST_R_34_10, curveType: GOST_CURVE_34_10_2012, privateKeys: BigInteger[]) {
    this._algType = algType;
    this._curveType = curveType;
    this._privateKeys = privateKeys;
    this._algorithm = {
      name: this._algType,
      ukm: this._privateKeys[SIGNER_KEYS.Q],
      namedCurve: this._curveType
    };
    this._q = ecp.q;
    this._curve = new ModCurve(ecp.a, ecp.b, ecp.p, ecp.x, ecp.y);
    this._p = this._curve.p;
    this._G = this._curve.G;
  }

  get gostSign() {
    return this._gostSign;
  }

  get algorithm() {
    return this._algorithm;
  }

  get curve() {
    return this._curve;
  }

  get G() {
    return this._G;
  }

  get p() {
    return this._p;
  }

  get q() {
    return this._q;
  }

  protected init$(): Observable<any> {
    const that = this;

    return forkJoin(this._privateKeys.map(privateKey =>
      Gost.generatePublicKey$(this._algType, privateKey, this._curveType).pipe(
        tap((keyPair: EcKeyPair) => {
          if (privateKey.notEquals(keyPair.privateKey)) {
            throw new Error('Incorrect private key. Must corresponds to parameters of curve.');
          }
          that._keyPairs.push(keyPair);
        })
      )
    ));
  }

  protected async init() {
    const that = this;
    for (const privateKey of this._privateKeys) {
      await Gost.generatePublicKey(this._algType, privateKey, this._curveType)
        .then((keyPair) => {
          if (privateKey.notEquals(keyPair.privateKey)) {
            throw new Error('Incorrect private key. Must corresponds to parameters of curve.');
          }
          that._keyPairs.push(keyPair);
        });
    }
  }

  toJSON(radix?: number) {
    radix = radix | 16;
    return {
      algType: this._algType,
      curveType: this._curveType,
      privateKeys: this._privateKeys.map(pk => pk.toString(radix)),
      curve: this._curve.toJSON(radix),
      q: this._q.toString(radix),
      keyPairs: this._keyPairs.map(kp => kp.toJSON(radix))
    };
  }

  toString(radix?: number) {
    radix = radix | 16;
    return JSON.stringify(this.toJSON(radix));
  }
}

export enum SIGNER_KEYS {
  Q = 0,
  A = 1,
  B = 2
}

export enum REQUESTER_KEYS {
  t1 = 0,
  t2 = 1,
  t3 = 2,
  t4 = 3,
}

export class GostEcBlindRequester2001 extends GostEc {

  private _signerPublicKeys: ModPoint[] = [];

  private t1?: BigInteger;
  private t2?: BigInteger;
  private t3?: BigInteger;
  private t4?: BigInteger;

  rho: BigInteger;
  omega: BigInteger;
  sigma: BigInteger;
  delta: BigInteger;

  private constructor(algType: GOST_R_34_10, curveType: GOST_CURVE_34_10_2012,
                      privateKeys: BigInteger[], signerPublicKeys: ModPoint[]) {
    super(algType, curveType, privateKeys);
    this._signerPublicKeys = signerPublicKeys;

    this.t1 = this._privateKeys[REQUESTER_KEYS.t1];
    this.t2 = this._privateKeys[REQUESTER_KEYS.t2];
    this.t3 = this._privateKeys[REQUESTER_KEYS.t3];
    this.t4 = this._privateKeys[REQUESTER_KEYS.t4];
  }

  static getInstance$(algType: GOST_R_34_10, curveType: GOST_CURVE_34_10_2012,
                      privateKeys: BigInteger[], signerPublicKeys: ModPoint[]) {
    const requester = new GostEcBlindRequester2001(algType, curveType, privateKeys, signerPublicKeys);
    return requester.init$().pipe(map(() => requester));
  }

  // @ts-ignore
  cipherMessage(message: string, service: BlindSignatureService): Observable<BigInteger> {
    service.emitEvent('Генерация rs');

    const A = this._signerPublicKeys[SIGNER_KEYS.A];
    const B = this._signerPublicKeys[SIGNER_KEYS.B];
    const Q = this._signerPublicKeys[SIGNER_KEYS.Q];
    const Z: ModPoint = new ModPoint(
      bigInt('8e7e4fd43549adbc1d1114eba80fd4a41a1bc823b0e1b0dc3f75580979a7b188', 16),
      bigInt('cecb5cf337d7908efcfea414d9b6f9ced465a94b086cbfc056180ba978a778d0', 16),
      curve);

    const {Alpha, Beta} = service.calculateAlphaBeta(A, B, Q, this.G, Z, this.t1, this.t2, this.t3, this.t4);
    const stringMessage = service.createHashMessage(Alpha, Beta, Z, message);
    return service.getGOSTHashNew(stringMessage).pipe(
      map(hashMessage => {
        service.emitEvent(hashMessage);

        service.emitEvent('Генерация e');
        const e = BlindSignatureService.calculateE(hashMessage, this.t2, this.t4);
        service.emitEvent(e.toString(16));
        return e;
      })
    );
  }

  extractSign(sign: { r: string, c: string, s: string, d: string }): void {
    const {rho, omega, sigma, delta} = BlindSignatureService.extractSign(
      bigInt(sign.r, 16), bigInt(sign.c, 16), bigInt(sign.s, 16), bigInt(sign.d, 16),
      this.t1, this.t2, this.t3, this.t4);

    this.rho = rho;
    this.omega = omega;
    this.sigma = sigma;
    this.delta = delta;
  }
}
