import { HttpService, Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { LoggerService } from '../logger/logger.service'
import { chunk } from 'lodash'
import {
  EncryptedBulletinsSums,
  IKeys,
  PartiallyDecrypted,
  EncryptedBulletin,
  ICryptoService,
  IParamSet,
  KeyPair,
  Point,
} from './interfaces'
import { Encrypt } from '@vostokplatform/voting-encrypt'

const MAX_CONTENT_LENGTH = 2 ** 30 // 1 GB

@Injectable()
export class CryptoService implements ICryptoService {
  private cryptoUrl: string
  private basePoint: Point

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.cryptoUrl = this.configService.getCryptoUrl()
  }

  async generateKeys(): Promise<IKeys> {
    try {
      const { data } = await this.httpService.get(`${this.cryptoUrl}/v1/generateKeys`).toPromise()
      return this.mapKeys(data)
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async getParamSet(): Promise<IParamSet> {
    try {
      const { data } = await this.httpService.get(`${this.cryptoUrl}/v1/getParamSet`).toPromise()
      return this.mapParamSet(data)
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async generatePolynomialCoefficients(privateKey: string, k: number): Promise<string[]> {
    try {
      const { data } = await this.httpService.post(
        `${this.cryptoUrl}/v1/generatePolynomialCoefficients`,
        {
          privateKey,
          k,
        },
      ).toPromise()
      return data.polynomialCoefficients
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async calculatePolynomialCoefficientsExponents(
    polynomialCoefficients: string[],
  ): Promise<Point[]> {
    try {
      const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/calculatePolynomialCoefficientsExponents`, {
        polynomialCoefficients,
      }).toPromise()
      return data.polynomialCoefficientsExponents
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async unblindPublicKeys(
    publicKeysCommits: Point[],
    secretKeysOfCommits: string[],
  ): Promise<Point[]> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/unblindPublicKeys`, {
          publicKeysCommits,
          secretKeysOfCommits,
        })
        .toPromise()
      return data.unblindedPublicKeys
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async calculateMainKey(
    publicKeysCommits: Point[],
    secretKeysOfCommits: string[],
  ): Promise<Point> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/calculateMainKey`, {
          publicKeysCommits,
          secretKeysOfCommits,
        })
        .toPromise()
      return data.mainKey
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async validateMainKey(mainKey: Point, dimensions: number[]): Promise<boolean> {
    const { q, hashLength, basePoint, pedersenBase } = await this.getParamSet()
    const enc = new Encrypt({
      q,
      hashLength,
      mainKey,
      basePoint,
      pedersenBase,
    })
    const bulletins = dimensions.map((optionsNum) => [1, ...Array(optionsNum - 1).fill(0)].sort(() => Math.random() - 0.5))
    const encrypted = bulletins.map((bulletin) => enc.makeEncryptedBulletin(bulletin) as any)
    const verified = await this.verifyEncryptedBulletins(encrypted, mainKey)
    return verified.every(Boolean)
  }

  async calculateEncryptedShadows(
    polynomialCoefficients: string[],
    unblindedPublicKeys: Point[],
  ): Promise<KeyPair[]> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/calculateEncryptedShadows`, {
          polynomialCoefficients,
          unblindedPublicKeys,
        })
        .toPromise()
      return data.encryptedShadows
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async decryptAndCheckShadows(
    privateKey: string,
    idx: number,
    encryptedShadows: KeyPair[],
    polynomialCoefficientsExponents: Point[][],
    unblindedPublicKeys: Point[],
  ): Promise<any> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/decryptAndCheckShadows`, {
          privateKey,
          idx,
          encryptedShadows,
          polynomialCoefficientsExponents,
          unblindedPublicKeys,
        })
        .toPromise()
      return data
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async restoreCommonPrivateKey(
    indexes: number[],
    decryptedShadowsSums: string[],
  ): Promise<string> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/restoreCommonSecret`, {
          indexes,
          decryptedShadowsSums,
        })
        .toPromise()
      return data
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async makeEncryptedBulletin(bulletin: number[], mainKey: Point): Promise<EncryptedBulletin> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/makeEncryptedBulletin`, {
          bulletin,
          mainKey,
        })
        .toPromise()
      return data
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async verifyEncryptedBulletin(
    encryptedBulletin: EncryptedBulletin,
    mainKey: Point,
  ): Promise<boolean> {
    try {
      const { data } = await this.httpService
        .post(`${this.cryptoUrl}/v1/verifyEncryptedBulletin`, {
          encryptedBulletin,
          mainKey,
        })
        .toPromise()
      return data.verified
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async verifyEncryptedBulletins(
    encryptedBulletins: EncryptedBulletin[],
    mainKey: Point,
  ): Promise<EncryptedBulletin[]> {
    try {
      const verifiedBulletins: EncryptedBulletin[] = []
      const chunks = chunk(encryptedBulletins, this.configService.getBulletinChunkSize())
      // tslint:disable-next-line:prefer-for-of
      for (let ch = 0; ch < chunks.length; ch++) {
        const {
          data: { verified },
        } = await this.httpService
          .post(
            `${this.cryptoUrl}/v2/verifyEncryptedBulletins`,
            {
              encryptedBulletins: chunks[ch],
              mainKey,
            },
            {
              maxContentLength: MAX_CONTENT_LENGTH,
            },
          )
          .toPromise()
        verifiedBulletins.push(...verified)
      }
      return verifiedBulletins
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async addEncryptedBulletins(
    encryptedBulletins: EncryptedBulletin[],
    mainKey: Point,
    acc: EncryptedBulletinsSums = {
      sum_A: [],
      sum_B: [],
    },
  ): Promise<EncryptedBulletinsSums> {
    try {
      const chunks = chunk(encryptedBulletins, this.configService.getBulletinChunkSize())
      // tslint:disable-next-line:prefer-for-of
      for (let ch = 0; ch < chunks.length; ch++) {
        const { data } = await this.httpService
          .post(
            `${this.cryptoUrl}/v1/addEncryptedBulletins`,
            {
              encryptedBulletins: chunks[ch],
              mainKey,
              prevSums: acc,
            },
            {
              maxContentLength: MAX_CONTENT_LENGTH,
            },
          )
          .toPromise()

        acc = data
      }

      return acc
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async subtractEncryptedBulletins(
    encryptedBulletins: EncryptedBulletin[],
    mainKey: Point,
    acc: EncryptedBulletinsSums = {
      sum_A: [],
      sum_B: [],
    },
  ): Promise<EncryptedBulletinsSums> {
    try {
      const chunks = chunk(encryptedBulletins, this.configService.getBulletinChunkSize())
      // tslint:disable-next-line:prefer-for-of
      for (let ch = 0; ch < chunks.length; ch++) {
        const { data } = await this.httpService
          .post(
            `${this.cryptoUrl}/v1/subtractEncryptedBulletins`,
            {
              encryptedBulletins: chunks[ch],
              mainKey,
              prevSums: acc,
            },
            {
              maxContentLength: MAX_CONTENT_LENGTH,
            },
          )
          .toPromise()

        acc = data
      }

      return acc
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  // async calculateEncryptedBulletinsSum (
  //   encryptedBulletins: EncryptedBulletin[],
  //   mainKey: Point
  // ): Promise<EncryptedBulletinsSums> {
  //   try {
  //     const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/calculateEncryptedBulletinsSum`, {
  //       encryptedBulletins,
  //       mainKey
  //     }, {
  //       maxContentLength: MAX_CONTENT_LENGTH
  //     }).toPromise()
  //     return data
  //   } catch (err) {
  //     this.loggerService.error(err.message, '', 'CryptoService')
  //     throw new InternalServerErrorException()
  //   }
  // }

  async partiallyDecryptSumA(
    // tslint:disable-next-line:variable-name
    sum_A: Point[],
    decryptedShadowsSum: string,
  ): Promise<PartiallyDecrypted[]> {
    try {
      const { data } = await this.httpService
        .post(
          `${this.cryptoUrl}/v1/partiallyDecryptSumA`,
          {
            sum_A,
            decryptedShadowsSum,
          },
          {
            maxContentLength: MAX_CONTENT_LENGTH,
          },
        )
        .toPromise()
      return data.partiallyDecrypted
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  // async calculateVotingResult (
  //   indexes: number[],
  //   polynomialCoefficientsExponents: Point[][],
  //   encryptedBulletins: EncryptedBulletin[],
  //   partialDecrypts: PartiallyDecrypted[],
  //   mainKey: Point
  // ): Promise<number[]> {
  //   try {
  //     const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/calculateVotingResult`, {
  //       indexes,
  //       polynomialCoefficientsExponents,
  //       encryptedBulletins,
  //       partialDecrypts,
  //       mainKey
  //     }, {
  //       maxContentLength: MAX_CONTENT_LENGTH
  //     }).toPromise()
  //     return data.result
  //   } catch (err) {
  //     this.loggerService.error(err.message, '', 'CryptoService')
  //     throw new InternalServerErrorException()
  //   }
  // }

  async calculateVotingResult(
    indexes: number[],
    votersNum: number,
    optionsNum: number,
    polynomialCoefficientsExponents: Point[][],
    // tslint:disable-next-line:variable-name
    sum_A: Point[],
    // tslint:disable-next-line:variable-name
    sum_B: Point[],
    partialDecrypts: PartiallyDecrypted[][],
    mainKey: Point,
  ): Promise<number[]> {
    try {
      const { data } = await this.httpService
        .post(
          `${this.cryptoUrl}/v2/calculateVotingResult`,
          {
            indexes,
            votersNum,
            optionsNum,
            polynomialCoefficientsExponents,
            sum_A,
            sum_B,
            partialDecrypts,
            mainKey,
          },
          {
            maxContentLength: MAX_CONTENT_LENGTH,
          },
        )
        .toPromise()
      return data.result
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async calculateVotingResultRTK(
    indexes: number[],
    votersNum: number,
    optionsNum: number,
    polynomialCoefficientsExponents: Point[][],
    // tslint:disable-next-line:variable-name
    sum_A: Point[],
    // tslint:disable-next-line:variable-name
    sum_B: Point[],
    partialDecrypts: PartiallyDecrypted[][],
    decryptKey: Point,
    commissionPubKey: Point,
    commissionDecrypt: PartiallyDecrypted[],
  ): Promise<number[]> {
    try {
      const { data } = await this.httpService
        .post(
          `${this.cryptoUrl}/v2/calculateVotingResultRTK`,
          {
            indexes,
            votersNum,
            optionsNum,
            polynomialCoefficientsExponents,
            sum_A,
            sum_B,
            partialDecrypts,
            decryptKey,
            commissionPubKey,
            commissionDecrypt,
          },
          {
            maxContentLength: MAX_CONTENT_LENGTH,
          },
        )
        .toPromise()
      return data.result
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async pointValidate(point: Point, curve: string = 'gost'): Promise<boolean> {
    try {
      const { data } = await this.httpService
        .post(
          `${this.cryptoUrl}/v1/pointValidate`,
          {
            point,
            curve,
          },
        )
        .toPromise()
      return data.valid
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async addCommissionPubKey(decryptKey: Point, commissionPubKey: Point): Promise<Point> {
    try {
      const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/addCommissionPubKey`,
        {
          decryptKey,
          commissionPubKey,
        }).toPromise()
      return data.mainKey
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async generateKeyPair(format: string = 'hex'): Promise<KeyPair> {
    try {
      const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/generateKeyPair`, { format }).toPromise()
      return data
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  // tslint:disable-next-line:variable-name
  async verifyEqualityOfDl(decrypted: PartiallyDecrypted[], sum_A: Point[], publicKey: Point): Promise<boolean> {
    try {
      const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/verifyEqualityOfDl`, {
        decrypted,
        sum_A,
        publicKey,
      }).toPromise()
      return data.verified
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  async validatePrivateKey(publicKey: Point, privateKey: string): Promise<boolean> {
    try {
      const { data } = await this.httpService.post(`${this.cryptoUrl}/v1/validatePrivateKey`, {
        publicKey,
        privateKey,
      }).toPromise()
      return data.valid
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }

  }

  async blindSignatureVerifyRSA(
    signature: string,
    message: string,
    modulo: string,
    publicExp: string,
  ): Promise<boolean> {
    const { data: { verified } } = await this.httpService
      .post(`${this.cryptoUrl}/v1/blindSignatureVerifyRSA`, {
        signature,
        message,
        modulo,
        publicExp,
      })
      .toPromise()

    return verified
  }

  async blindSignatureGenerateRSA(message: string): Promise<any> {
    const { data } = await this.httpService
      .post(`${this.cryptoUrl}/v1/blindSignatureGenerateRSA`, {
        message,
      })
      .toPromise()
    return data
  }

  async getBasePoint(): Promise<Point> {
    if (this.basePoint) {
      return this.basePoint
    }
    try {
      const { data } = await this.httpService.get(`${this.cryptoUrl}/v1/getBasePoint`).toPromise()
      this.basePoint = data
      return data
    } catch (err) {
      this.loggerService.error(err.message, '', 'CryptoService')
      throw new InternalServerErrorException()
    }
  }

  private mapKeys(keys: any): IKeys {
    return {
      privateKey: keys.privateKey,
      publicKey: keys.publicKey,
      publicKeyCommit: keys.publicKeyCommit, // C
      secretKeyOfCommit: keys.secretKeyOfCommit, // r
    }
  }

  private mapParamSet(params: any): IParamSet {
    return {
      a: params.a,
      b: params.b,
      p: params.p,
      q: params.q,
      pedersenBase: params.pedersen_base,
      basePoint: params.base_point,
      hashLength: params.hash_length ? params.hash_length : '0',
    }
  }
}
