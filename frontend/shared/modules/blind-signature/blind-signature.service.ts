/* tslint:disable:max-line-length no-bitwise */
import { Injectable } from '@angular/core';
import {
  ECGostParams,
  Gost,
  GOST_CURVE_34_10_2012,
  GOST_R_34_10,
  GOST_R_34_11
} from '@shared/modules/blind-signature/libs/gost';
import { from, Observable, of, Subject } from 'rxjs';
import * as bigInt from 'big-integer';
import { BigInteger } from 'big-integer';
import * as jsbn from 'jsbn';
import { flatMap, map, switchMap, tap } from 'rxjs/operators';
import { GostEcBlindRequester2001 } from '@shared/modules/blind-signature/libs/sign';
import { ModPoint } from '@shared/modules/blind-signature/libs/ec-math/modpoint';
import { ModCurve } from '@shared/modules/blind-signature/libs/ec-math/curve';
import { BlindSignatureApiService } from '@shared/modules/blind-signature/blind-signature-api.service';
import { BlindSignKeysDto } from '@shared/models/portal.models';
import { CryptUtils } from '@shared/modules/blind-signature/libs/utils';
import { sha256 } from 'js-sha256';

const ecp = ECGostParams[GOST_CURVE_34_10_2012.X_256_A];
const curve = new ModCurve(ecp.a, ecp.b, ecp.p, ecp.x, ecp.y);

@Injectable()
export class BlindSignatureService {

  constructor(private service: BlindSignatureApiService) {
  }

  // tslint:disable-next-line:variable-name
  public events$ = new Subject<{ time: string, message: string }>();

  static modQ(numb: BigInteger): BigInteger {
    const q = new jsbn.BigInteger(ecp.q.toString());
    return bigInt(new jsbn.BigInteger(numb.toString()).mod(q).toString());
  }

  static getRandomNumber(): BigInteger {
    let random: BigInteger = bigInt.one;
    while (random.compareTo(bigInt.one) <= 0 || random.compareTo(ecp.q) >= 0) {
      random = BlindSignatureService.modQ(bigInt.randBetween(bigInt.one, ecp.q.subtract(bigInt.one)));
    }
    return random;
  }

  static calculateE(hashMessage: string, t2: BigInteger, t4: BigInteger): BigInteger {
    const es: BigInteger = BlindSignatureService.modQ(bigInt(hashMessage, 16));
    return BlindSignatureService.modQ(es.subtract(t2).subtract(t4));
  }

  static extractSign(r: BigInteger, c: BigInteger, s: BigInteger, d: BigInteger,
                     t1: BigInteger, t2: BigInteger, t3: BigInteger, t4: BigInteger)
    : { rho: BigInteger, omega: BigInteger, sigma: BigInteger, delta: BigInteger } {
    const rho: BigInteger = BlindSignatureService.modQ(r.add(t1));
    const omega = BlindSignatureService.modQ(c.add(t2));
    const sigma = BlindSignatureService.modQ(s.add(t3));
    const delta = BlindSignatureService.modQ(d.add(t4));

    return {rho, omega, sigma, delta};
  }

  generatePrivateKey(): Observable<any> {
    return from(this.getGOSTHash(new Date().getTime().toString()));
  }

  getGOSTHashNew(data: string): Observable<string> {
    return from(Gost.hashNew(GOST_R_34_11.LENGTH_256, data, '2012'));
  }

  getGOSTHash(data: string): Observable<string> {
    return from(Gost.hash(GOST_R_34_11.LENGTH_256, data, '2012'));
  }

  littleEndian(data: string): string {
    return data.padStart(64, '0').match(/../g).reverse().join(``);
  }

  stringToBytes(str: string): ArrayBuffer {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  intToByteArray(num: number): ArrayBuffer {
    const arr = new Uint8Array([
      (num & 0xff000000) >> 24,
      (num & 0x00ff0000) >> 16,
      (num & 0x0000ff00) >> 8,
      (num & 0x000000ff)
    ]).reverse();
    return arr.buffer;
  }

  FDH_padding(message: string, N: BigInteger, bitCount: number): BigInteger {
    if (bitCount % 256 !== 0) {
      throw new Error('Wrong bit count!!!');
    }

    const blockCount: number = bitCount / 256;
    const messageBytes: ArrayBuffer = this.stringToBytes(message);

    const buffer = new ArrayBuffer(512);
    const allBlocks = new Int8Array(buffer);

    for (let i = 0; i < blockCount - 1; i++) {
      const md = sha256.create();
      md.update(this.intToByteArray(i));
      md.update(messageBytes);
      allBlocks.set(md.digest(), i * 32);
    }

    let j = blockCount - 1;
    let res: BigInteger = null;

    do {
      const md = sha256.create();
      md.update(this.intToByteArray(j));
      md.update(messageBytes);
      allBlocks.set(md.digest(), 480);
      const hex = CryptUtils.byteArrayToHexString(allBlocks);
      res = bigInt(hex, 16);
      j++;
    } while (N.compareTo(res) <= 0);

    return res;
  }

  modPow(r: string, e: any, N: BigInteger): BigInteger {
    const jsbnBigInt = new jsbn.BigInteger(bigInt(r, 16).toString());
    const jsbbnN = new jsbn.BigInteger(N.toString());
    const jsbbnE = new jsbn.BigInteger(bigInt(e).toString());

    const MaskedMessage = jsbnBigInt.modPow(jsbbnE, jsbbnN);
    return bigInt(MaskedMessage.toString());
  }

  getSignature(r: BigInteger, N: BigInteger, MaskedMessage: BigInteger): BigInteger {
    const jsbnBigInt = new jsbn.BigInteger(r.toString());
    const jsbbnN = new jsbn.BigInteger(N.toString());
    const jsbbnPaddedMessage = new jsbn.BigInteger(bigInt(MaskedMessage).toString());

    const Signature = jsbnBigInt.modInverse(jsbbnN).multiply(jsbbnPaddedMessage).mod(jsbbnN);
    return bigInt(Signature.toString());
  }

  getMaskedMessage(r: BigInteger, e: BigInteger, N: BigInteger, PaddedMessage: BigInteger): BigInteger {
    const jsbnBigR = new jsbn.BigInteger(r.toString());
    const jsbbnN = new jsbn.BigInteger(N.toString());
    const jsbbnE = new jsbn.BigInteger(e.toString());
    const jsbbnPaddedMessage = new jsbn.BigInteger(bigInt(PaddedMessage).toString());

    const MaskedMessage = jsbnBigR.modPow(jsbbnE, jsbbnN).multiply(jsbbnPaddedMessage).mod(jsbbnN);
    return bigInt(MaskedMessage.toString());
  }

  randomByN(modulus: string): BigInteger {
    const n = bigInt(modulus, 16);
    return bigInt.randBetween(bigInt.zero, n.add(bigInt(-1))).mod(n);
  }

  applyBlindingLayer(
    publicKey: {
      modulus: string,
      publicExponent: string,
    },
    message: string,
    random: BigInteger,
  ): BigInteger {
    const n = bigInt(publicKey.modulus, 16);
    const e: BigInteger = bigInt(publicKey.publicExponent, 16);
    const paddedMessage = this.FDH_padding(message, n, 4096);
    return this.getMaskedMessage(random, e, n, paddedMessage);
  }

  extractBlindSign(blingSign: string, modulus: string, random: BigInteger): BigInteger {
    const n = bigInt(modulus, 16);
    return this.getSignature(random, n, bigInt(blingSign, 16));
  }

  tastAlgoRSAWithBackend(): void {
    const InitialMessage = 'Hello!';
    let r: BigInteger = null; // '7e3c17ab27f4fb4cd33a92d39d02936ff63cf0fc8cd7cb49155c1838be7bd97b1fd5f06a84b9d25da9536e7342746c755f4af7fe81f7334f67b709ba6a42416700ea21222d5d3d481ced975e21da84d119d1fbec71b84687a981823b86a056e8c3305cfd37bbedd4800b18e1b95e717323f728871d9105ccb10e30923cd2422522c3a033cf792827ac085b3f90a46ffa388231c4e28bd60966f3f6da211e752c7f63a3bffae873d7eb680f692a287018e851348da022acd1eb9c0f5a789cd1f881d3f03dda065d81e801cb890b0b6482db17ee5fe64c5401b9bf58f8008bbacdf0b82276c188e59bc22fc51bcea70e9a39bccf17d12b1f2612cf9a5695823ab818ebb1f77fd2376d7e8959904e6c6e64b9eb55a41600f22c19fbaf1ddb26c734018ae3cc9c11903b9857f237bfa2374729199d57fca0b4325ce3de73edb3b975cb4228c1b04be32c90b11a2eca73fa07de71d8b331e6d5ae09a2cbe30bfb8c2a7d7de7dd0464fe8734e359c9b2315b42588f0d4dbbbac87e9f07f770d74ee1bd4ab8c71fcefee4c7705e178b60b7aaa66795b799149a4bf244fb53a5d0631205f84dffe71305437f85aa85ca8b35da263af22d083b14163fae42488969e07216b9f512ee408b0179b41cb8088c4cbc94b88e3722b038d691ca1a2c355a55c23e9a913bd38aab11327c30316c818d3f3866663e7f91b6dea73e118878e2dde872';
    let N: BigInteger = null;

    this.service.getRSAKeys().pipe(
      map(response => {
        N = bigInt(response.modulus, 16);
        const e: BigInteger = bigInt(response.exponent, 16);
        console.log(`e: ${e}`);
        console.log(`N: ${N.toString()}`);

        const PaddedMessage = this.FDH_padding(InitialMessage, N, 4096);
        console.log(`PaddedMessage hex: 0x${PaddedMessage.toString(16)}`);
        r = bigInt.randBetween(bigInt.zero, N.add(bigInt(-1))).mod(N); // '7e3c17ab27f4fb4cd33a92d39d02936ff63cf0fc8cd7cb49155c1838be7bd97b1fd5f06a84b9d25da9536e7342746c755f4af7fe81f7334f67b709ba6a42416700ea21222d5d3d481ced975e21da84d119d1fbec71b84687a981823b86a056e8c3305cfd37bbedd4800b18e1b95e717323f728871d9105ccb10e30923cd2422522c3a033cf792827ac085b3f90a46ffa388231c4e28bd60966f3f6da211e752c7f63a3bffae873d7eb680f692a287018e851348da022acd1eb9c0f5a789cd1f881d3f03dda065d81e801cb890b0b6482db17ee5fe64c5401b9bf58f8008bbacdf0b82276c188e59bc22fc51bcea70e9a39bccf17d12b1f2612cf9a5695823ab818ebb1f77fd2376d7e8959904e6c6e64b9eb55a41600f22c19fbaf1ddb26c734018ae3cc9c11903b9857f237bfa2374729199d57fca0b4325ce3de73edb3b975cb4228c1b04be32c90b11a2eca73fa07de71d8b331e6d5ae09a2cbe30bfb8c2a7d7de7dd0464fe8734e359c9b2315b42588f0d4dbbbac87e9f07f770d74ee1bd4ab8c71fcefee4c7705e178b60b7aaa66795b799149a4bf244fb53a5d0631205f84dffe71305437f85aa85ca8b35da263af22d083b14163fae42488969e07216b9f512ee408b0179b41cb8088c4cbc94b88e3722b038d691ca1a2c355a55c23e9a913bd38aab11327c30316c818d3f3866663e7f91b6dea73e118878e2dde872';
        console.log(`r hex: 0x${r}`);

        const MaskedMessage: BigInteger = this.getMaskedMessage(r, e, N, PaddedMessage);
        console.log(`MaskedMessage hex: 0x${MaskedMessage.toString(16)}`);

        return MaskedMessage;
      }),
      switchMap(MaskedMessage => this.service.getMaskedSignature(MaskedMessage)),
      map(response => {
        const MaskedSignature: BigInteger = bigInt(response.blindSign, 16);
        const Signature: BigInteger = this.getSignature(r, N, MaskedSignature);
        console.log(`Signature hex: 0x${Signature.toString(16)}`);

        return Signature;
      }),
      switchMap(Signature => this.service.verifyRSA(Signature, InitialMessage)),
      tap(verify => console.log(`verify: ${verify}`))
    ).subscribe();
  }

  // Тестирование алгоритма полностью // TODO НЕ УДАЛЯТЬ ПОТ И КРОВЬ!
  testAlgoRSA(): void {
    const e = bigInt('65537'); // 65537  e = 2^16 + 1
    const N: BigInteger = bigInt('531472882770570676887293000203683998395857262924991541446670888838006598797885166924231953798360109794607329237744151603917495201173382697588394565520486479897045440389197396045729909134637979342037950565164286944715296915074941318165306056611723219784320804151038181865705703854418187727984887595020393698712456038519409591918158389776622860787519923190102630707623894247248745831344027403822017518599475726034146758889175085317039374953208595391326037355868651662824427460553225467641095327491840687703263570044634178758049015580565234054421334148471889304047433287697574623716100161497681239470120121798051093986202228003217542188696754447176638745657823509746078165867784692704502582019231109600917470153996285910081586259117198962726726130547959014965905579977295977311082160426110219693228632597177359973352897897423340415941622005125866415622804824990780976808559483720287981583214783913324119411073991583196975920806996613883890633090298669766886012131202640130156013555529900867254163683268680261329440074471283510899115618237917679050056944970901403722137324559140509241664112727384991804907894028818455340243989966152105922086161015279733725729479886644300792405185458040012744056933012184889148841063842605723472941900157');
    console.log(`e: ${e}`);
    console.log(`N: ${N.toString()}`);

    const InitialMessage = 'Hello!';

    const PaddedMessage = this.FDH_padding(InitialMessage, N, 4096);
    console.log(`PaddedMessage hex: 0x${PaddedMessage.toString(16)}`);

    // r = random.randrange(modulo) рандомный BigInteger по модулю N
    const r = bigInt.randBetween('1', '5').mod(N); // '7e3c17ab27f4fb4cd33a92d39d02936ff63cf0fc8cd7cb49155c1838be7bd97b1fd5f06a84b9d25da9536e7342746c755f4af7fe81f7334f67b709ba6a42416700ea21222d5d3d481ced975e21da84d119d1fbec71b84687a981823b86a056e8c3305cfd37bbedd4800b18e1b95e717323f728871d9105ccb10e30923cd2422522c3a033cf792827ac085b3f90a46ffa388231c4e28bd60966f3f6da211e752c7f63a3bffae873d7eb680f692a287018e851348da022acd1eb9c0f5a789cd1f881d3f03dda065d81e801cb890b0b6482db17ee5fe64c5401b9bf58f8008bbacdf0b82276c188e59bc22fc51bcea70e9a39bccf17d12b1f2612cf9a5695823ab818ebb1f77fd2376d7e8959904e6c6e64b9eb55a41600f22c19fbaf1ddb26c734018ae3cc9c11903b9857f237bfa2374729199d57fca0b4325ce3de73edb3b975cb4228c1b04be32c90b11a2eca73fa07de71d8b331e6d5ae09a2cbe30bfb8c2a7d7de7dd0464fe8734e359c9b2315b42588f0d4dbbbac87e9f07f770d74ee1bd4ab8c71fcefee4c7705e178b60b7aaa66795b799149a4bf244fb53a5d0631205f84dffe71305437f85aa85ca8b35da263af22d083b14163fae42488969e07216b9f512ee408b0179b41cb8088c4cbc94b88e3722b038d691ca1a2c355a55c23e9a913bd38aab11327c30316c818d3f3866663e7f91b6dea73e118878e2dde872';
    // MaskedMessage = 0x81e71dc29faf266152da1980384358ab58d637ce3834aa5c3d283db2a089df4b7c6b665d3d5232519a083d5a3e3d9c9c67a75a253ba4c2a8a791942c2c38aad7c2f8eb2d19237b8b72eeeb703e485227a8bd71262173731307e16d818f51574916713e8548c273001a928ce68689fb67ab01e5e3fc6581e55ca96d820f7cc70233840dced5c6c503f18be4aaf84570b3765611f04d50c46774ac188322be44c26edb403118c588993a1176a801f6eef69faf22527640b4e366e3a9b1f46c57b6d399f7fb8d7eed91dc6ea61ccc29679376df442bc4ff2149e05cc5b135632ae2c809d8480179df30af8bb850feb64497e04ec7bf2663d126fd47663ebe6a5041f1956d16ae41e7e651e45f8063adc880520963e51e8171bfd3004a90ebe619df5212a99170cc7711174bd93f8253454b21556285e38bdbbd6cc814b87df66e75c749bc1f953d749fe410cc45b50435002d6858196fa775ab03525d861615313ecbf4b3e3f7207ce2c6d0979813f5634240b1f45
    console.log(`r hex: 0x${r}`);
    const d = '23282399963902961889366589919965466215946811753019679196383601963073026613191453899926300248029233489789243362399308165690329565322928753601420278584758482746912697550351491890798946688520158669011260144232825240982614667183120321718305593611734705036861391713347126358186079249371112760227728035846980336435959248769233027730854826083718879920059961540485293082710349884551492275840955531629049426978639467925660853331260534811560188069192393264392588205879104916672550333998326293812618592325389850228055445162246436779443043223397512656518358337126551325082322672215385762922599168240697965091009692530903264807556670680484470229478940107545540835920598906558947901960121419927639247610499138992421409375496421992685721347527087138118721640418340821275729213415264535690693191336998922672043238344531550557349777887236388199934255219772830845326726984447157525409703422748423362819148906352436420831107204592249115128561378232761920339551114561374215401554512094507506349978765112270709835665263857161861822299858997294269998270864303157575035732881330471362077341228729301476533130040454166720399856834620556187156874147234515644344433865712782166068604850278956241690201025638224559129150999995816907370365944270837354719532673';
    const MaskedMessage: BigInteger = this.getMaskedMessage(r, e, N, PaddedMessage);
    // const MaskedMessage: BigInteger = bigInt(r, 16).modPow(e, N).multiply(PaddedMessage).mod(N);
    console.log(`MaskedMessage hex: 0x${MaskedMessage.toString(16)}`);
    // Отправляю Паше на подпись, получаю MaskedSignature
    // MaskedSignature = MaskedMessage в степени d по модулю N
    const MaskedSignature = this.modPow(MaskedMessage.toString(16), d, N);
    // s = m` * r в степени -1 по модулю N
    // Signature = (MaskedSignature * modInverse(r, modulo) ) % modulo
    const Signature: BigInteger = this.getSignature(r, N, MaskedSignature);
    console.log(`Signature hex: 0x${Signature.toString(16)}`);
    // verify signature v = s в степени e mod N === paddedMessage
    const verify = this.modPow(Signature.toString(16), e, N).equals(PaddedMessage);
    console.log(`verify: ${verify}`);
  }

  // Тестирование алгоритма полностью // TODO НЕ УДАЛЯТЬ ПОТ И КРОВЬ!
  testAlgo(): void {
    const MESSAGE = 'Hello!';
    const G = curve.G;
    const Z: ModPoint = new ModPoint(
      bigInt('8e7e4fd43549adbc1d1114eba80fd4a41a1bc823b0e1b0dc3f75580979a7b188', 16),
      bigInt('cecb5cf337d7908efcfea414d9b6f9ced465a94b086cbfc056180ba978a778d0', 16),
      curve); //  G.multiply(bigInt('100'));
    // Генерится на бекенде
    const u: BigInteger = bigInt('375ecd2cc566ccec81d6f9ee3c70acbcb679b2f89b45817ca734d302b723892e', 16); //  BlindSignatureService.getRandomNumber();
    const s: BigInteger = bigInt('548849d3bd520e72524c550c53bc32d9d25510971d6d86f40b79639186c5d618', 16); //  BlindSignatureService.getRandomNumber();
    const d: BigInteger = bigInt('4098e3cf69263f41a931f0004ae72d37a89fad32e73689bfda0e32c1a3105054', 16); //  BlindSignatureService.getRandomNumber();
    const privateKey: BigInteger = bigInt('4a15f47b688da7f9784a23e72f5c01274b13f50278ff07697c48bd823d03318d', 16); //   BlindSignatureService.getRandomNumber();

    const A: ModPoint = G.multiply(u); // Бэк
    const B: ModPoint = G.multiply(s).add(Z.multiply(d)); // Бэк
    const Q: ModPoint = G.multiply(privateKey);

    this.generatePrivateKeyParts().pipe(
      map(([t1, t2, t3, t4]) => {
        // tslint:disable-next-line:typedef
        const {Alpha, Beta} = this.calculateAlphaBeta(A, B, Q, G, Z, t1, t2, t3, t4);
        return {
          strMessage: this.createHashMessage(Alpha, Beta, Z, MESSAGE),
          t1,
          t2,
          t3,
          t4
        };
      }),
      flatMap(({strMessage}) => this.getGOSTHashNew(strMessage),
        (keys, hashMessage) => {
          return {...keys, hashMessage};
        }
      ),
      flatMap(({t1, t2, t3, t4, hashMessage}) => {
        const e: BigInteger = BlindSignatureService.calculateE(hashMessage, t2, t4);
        // Отдаем e бэку, он генерит следующее, возвращает r c s d
        const c = BlindSignatureService.modQ(e.subtract(d));
        const r = BlindSignatureService.modQ(u.subtract(c.multiply(privateKey)));
        // Считаем на фронте
        // tslint:disable-next-line:typedef
        const {rho, omega, sigma, delta} = BlindSignatureService.extractSign(r, c, s, d, t1, t2, t3, t4);

        // На бэке метод verification
        const Alpha1: ModPoint = G.multiply(rho).add(Q.multiply(omega));
        const Beta1: ModPoint = G.multiply(sigma).add(Z.multiply(delta));
        const strMessage1: string = this.createHashMessage(Alpha1, Beta1, Z, MESSAGE);
        return this.getGOSTHashNew(strMessage1).pipe(
          map(hashMessage => ({hashMessage, omega, delta}))
        );
      }),
      tap(({hashMessage, omega, delta}) => {
        const es: BigInteger = BlindSignatureService.modQ(bigInt(hashMessage, 16));
        const equal: boolean = es.compareTo(omega.add(delta).mod(ecp.q)) === 0;
        this.emitEvent(`${equal}`);
      })
    ).subscribe();
  }

  calculateAlphaBeta(A: ModPoint, B: ModPoint, Q: ModPoint, G: ModPoint, Z: ModPoint,
                     t1: BigInteger, t2: BigInteger, t3: BigInteger, t4: BigInteger)
    : { Alpha: ModPoint, Beta: ModPoint } {
    const Alpha: ModPoint = A.add(G.multiply(t1)).add(Q.multiply(t2));
    const Beta: ModPoint = B.add(G.multiply(t3)).add(Z.multiply(t4));

    return {Alpha, Beta};
  }

  createHashMessage(Alpha: ModPoint, Beta: ModPoint, Z: ModPoint, MESSAGE: string): string {
    return this.littleEndian(Alpha.x.toString(16)) +
      this.littleEndian(Alpha.y.toString(16)) +
      this.littleEndian(Beta.x.toString(16)) +
      this.littleEndian(Beta.y.toString(16)) +
      this.littleEndian(Z.x.toString(16)) +
      this.littleEndian(Z.y.toString(16)) +
      MESSAGE.split('')
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .reduce((current, previous) => current + previous)
      ;
  }

  emitEvent(message: string): void {
    this.events$.next({message, time: new Date().toLocaleString()});
  }

  /**
   * Создает ослепленную подпись (полностью)
   * @param message Сообщение хешированное ГОСТ шифрованием
   * @param publicKeyCoordinates Публичные ключи из бека
   */
  createBlindSign(message: string, publicKeyCoordinates: BlindSignKeysDto): Observable<{ requester: GostEcBlindRequester2001, s: any }> {
    return this.generateRandomCryptoParameters(publicKeyCoordinates).pipe(
      flatMap(requester => requester.cipherMessage(message, this),
        (requester, e) => {
          return {requester, e};
        }),
      flatMap(({e}) => this.service.blindSign(e.toString(16)), ({requester}, s) => {
        return {requester, s};
      })
    );
  }

  /**
   * Генерация приватного ключа
   * @param publicKeyCoordinates Публичные ключи из бэка
   */
  public generateRandomCryptoParameters(publicKeyCoordinates: BlindSignKeysDto): Observable<GostEcBlindRequester2001> {
    this.emitEvent('Генерация приватного ключа!');
    return this.generatePrivateKey().pipe(
      flatMap((privateKey) => this.getRequester(privateKey, publicKeyCoordinates))
    );
  }

  /**
   * Генерация μ, ε, δ, τ
   */
  private getRequester(privateKey: string, publicKeyCoordinates: BlindSignKeysDto): Observable<GostEcBlindRequester2001> {
    const keyParts$ = this.generatePrivateKeyParts(privateKey);

    return keyParts$.pipe(
      flatMap(([t1, t2, t3, t4]) => {
        this.emitEvent('Генерация Q C');
        const Q = new ModPoint(bigInt(publicKeyCoordinates.publicXCoord, 16), bigInt(publicKeyCoordinates.publicYCoord, 16), curve);
        const A = new ModPoint(bigInt(publicKeyCoordinates.ax, 16), bigInt(publicKeyCoordinates.ay, 16), curve);
        const B = new ModPoint(bigInt(publicKeyCoordinates.bx, 16), bigInt(publicKeyCoordinates.by, 16), curve);

        return GostEcBlindRequester2001.getInstance$(
          GOST_R_34_10.LENGTH_256,
          GOST_CURVE_34_10_2012.X_256_A,
          [t1, t2, t3, t4],
          [Q, A, B]
        );
      }),
    );
  }

  public generatePrivateKeyParts(privateKey?: string): Observable<BigInteger[]> {
    // const pkLen = privateKey.length;
    // const chunkLength = pkLen / 4;

    const t1: BigInteger = BlindSignatureService.getRandomNumber();
    const t2: BigInteger = BlindSignatureService.getRandomNumber();
    const t3: BigInteger = BlindSignatureService.getRandomNumber();
    const t4: BigInteger = BlindSignatureService.getRandomNumber();

    return of([t1, t2, t3, t4]);

    // return from(this.chunkString(privateKey, chunkLength));
  }

  private async chunkString(str: string, length: number): Promise<RegExpMatchArray | string[]> {
    return str.match(new RegExp('.{1,' + length + '}', 'g')) || [''];
  }
}
