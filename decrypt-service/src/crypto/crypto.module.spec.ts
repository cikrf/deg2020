import { Test, TestingModule } from '@nestjs/testing'
import {
  EncryptedBulletin,
  ICryptoService,
  IParamSet,
  KeyPair,
  PartiallyDecrypted,
  Point,
  Polynomial,
} from './interfaces'
import { CryptoModule } from './crypto.module'
import { LoggerService } from '../logger/logger.service'
import { CryptoService } from './crypto.service'
import { chunk } from 'lodash'
import { Encrypt } from '@vostokplatform/voting-encrypt'

export const promiseAll = (promises: Array<Promise<any>>) =>
  new Promise((resolve, reject) => {
    Promise.all(promises)
      .then((result) => resolve(result))
      .catch((err) => reject(err))
  })

type IKeys = {
  index?: number
  privateKey: string
  publicKey: Point
  publicKeyCommit: string[]
  secretKeyOfCommit: string
  polynomialCoefficientsExponents?: Point[]
  polynomialCoefficients?: string[]
  encryptedShadows?: KeyPair[]
  decryptedShadowsSum?: string
  partiallyDecrypted?: PartiallyDecrypted[]
}

describe('CryptoPythonService', () => {
  let cryptoService: ICryptoService
  let loggerService: LoggerService
  let paramSet: IParamSet

  const n = 3
  const k = 2
  const bulletinLength = 2
  const voters = 4
  const threads = 64

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [CryptoModule],
    }).compile()
    cryptoService = app.get<CryptoService>(CryptoService)
    loggerService = app.get<LoggerService>(LoggerService)
    loggerService.debug(`Number of decrypt service: ${n}`, 'CryptoConfig')
    loggerService.debug(`Minimum available: ${k}`, 'CryptoConfig')

    paramSet = await cryptoService.getParamSet()
  })

  describe('Simple function check', () => {
    let keys: IKeys
    it('should generate keys', async () => {
      keys = await cryptoService.generateKeys()
      expect(keys.privateKey).toBeDefined()
      expect(keys.publicKey).toBeDefined()
      expect(keys.publicKeyCommit).toBeDefined()
      expect(keys.secretKeyOfCommit).toBeDefined()
    })
  })

  describe('Bling signature RSA', () => {
    it('All signatures should be valid', async () => {
      const blindSignatures = await Promise.all(
        Array(1).fill(0).map(async () => {
          const seed = Math.random().toString(36).replace(/[^a-z]+/g, '')
          return cryptoService.blindSignatureGenerateRSA(seed)
        }),
      )
      // @ts-ignore
      const promises = blindSignatures.map(async ({ signature, message, modulo, publicExp }) => {
        return cryptoService.blindSignatureVerifyRSA(signature, message, modulo, publicExp)
      })
      const verified = await Promise.all(promises)
      expect(verified.every(Boolean)).toBeTruthy()
    })
  })

  describe('Whole coordination algorithm', () => {
    let services: any
    const indexes: number[] = Array(n)
      .fill(0)
      .map((_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
      .splice(0, k)
    let unblindedPublicKeys: any
    let mainKey: Point
    let decryptKey: Point
    let bulletins: number[][]
    const encryptedBulletins: EncryptedBulletin[] = []
    let verifiedBulletins: EncryptedBulletin[] = []
    let bulletinsSum: { sum_A: Point[]; sum_B: Point[] }
    let randomKeyPair: KeyPair
    let commissionDecrypt: PartiallyDecrypted[]

    describe('DKG Part', () => {
      it(`get random key pair`, async () => {
        randomKeyPair = await cryptoService.generateKeyPair('hex')
        expect(randomKeyPair.publicKey).toBeDefined()
        expect(randomKeyPair.privateKey).toBeDefined()
      })
      it('should be valid private key', async () => {
        const valid = await cryptoService.validatePrivateKey(randomKeyPair.publicKey, randomKeyPair.privateKey)
        expect(valid).toBeTruthy()
      })
      it('should be invalid private key', async () => {
        const valid = await cryptoService.validatePrivateKey(randomKeyPair.publicKey, '12313')
        expect(valid).toBeFalsy()
      })
      it(`should generate keys for new voting setup for ${n} services`, async () => {
        const promises = Array(n)
          .fill(0)
          .map(async (_, i) => ({ index: i + 1, ...(await cryptoService.generateKeys()) }))
        services = await promiseAll(promises)
        expect(services.length).toBe(n)
      })
      it('should generate polynomial coefficients', async () => {
        const promises = services.map(async (service: IKeys) =>
          cryptoService.generatePolynomialCoefficients(service.privateKey, k),
        )
        const results: any = await promiseAll(promises)
        expect(results.length).toBe(n)
        expect(
          results.some(
            (polynomialCoefficients: Polynomial[]) => polynomialCoefficients.length !== k,
          ),
        ).toBeFalsy()
        results.map((polynomialCoefficients: Polynomial, i: number) => {
          services[i].polynomialCoefficients = polynomialCoefficients
        })
      })
      it('should unblind public keys commits and compare it with saved keys', async () => {
        const publicKeysCommits = services.map((service: IKeys) => service.publicKeyCommit)
        const secretKeysOfCommits = services.map((service: IKeys) => service.secretKeyOfCommit)
        unblindedPublicKeys = await cryptoService.unblindPublicKeys(
          publicKeysCommits,
          secretKeysOfCommits,
        )
        expect(unblindedPublicKeys.length).toBe(n)
        expect(unblindedPublicKeys).toEqual(
          services.map((service: { publicKey: any }) => service.publicKey),
        )
      })
      it('should calculate main key', async () => {
        const publicKeysCommits = services.map((service: IKeys) => service.publicKeyCommit)
        const secretKeysOfCommits = services.map((service: IKeys) => service.secretKeyOfCommit)
        mainKey = await cryptoService.calculateMainKey(publicKeysCommits, secretKeysOfCommits)
      })
      if (process.env.CONTRACT_TYPE === 'blind') {
        it('BLIND: should mix commission key', async () => {
          decryptKey = mainKey
          mainKey = await cryptoService.addCommissionPubKey(decryptKey, randomKeyPair.publicKey)
          expect(mainKey).toBeDefined()
        })
      }
      it.skip('should validate main key', async () => {
        const valid = await cryptoService.validateMainKey(mainKey, [2])
        expect(valid).toBeTruthy()
      })
      it('should calculate exponents', async () => {
        const promises = services.map(async ({ polynomialCoefficients }: IKeys) =>
          cryptoService.calculatePolynomialCoefficientsExponents(
            polynomialCoefficients as string[],
          ),
        )
        const results: Point[][] = (await promiseAll(promises)) as Point[][]
        expect(results.length).toBe(n)
        expect(
          results.some((polynomialCoefficientsExponents) => !polynomialCoefficientsExponents),
        ).toBeFalsy()
        results.map((polynomialCoefficientsExponents: Point[], i: number) => {
          services[i].polynomialCoefficientsExponents = polynomialCoefficientsExponents
        })
      })
      it('should calculate encrypted shadows for each service', async () => {
        const promises = services.map(async ({ polynomialCoefficients }: IKeys) =>
          cryptoService.calculateEncryptedShadows(
            polynomialCoefficients as string[],
            unblindedPublicKeys,
          ),
        )
        const results = (await promiseAll(promises)) as KeyPair[][]
        expect(results.length).toBe(n)
        expect(
          results.some((encryptedShadows: KeyPair[]) => encryptedShadows.length !== n),
        ).toBeFalsy()
        results.map((encryptedShadows: KeyPair[], i: number) => {
          services[i].encryptedShadows = encryptedShadows
        })
      })
      it('should decrypt and check shadows for each service', async () => {
        const polynomialCoefficientsExponents = services.map(
          (service: IKeys) => service.polynomialCoefficientsExponents,
        )
        const promises = services.map(async ({ privateKey }: IKeys, i: number) => {
          // @ts-ignore
          const preparedShadows = services.map(({ encryptedShadows }) => encryptedShadows[i])
          return cryptoService.decryptAndCheckShadows(
            privateKey,
            i,
            preparedShadows,
            polynomialCoefficientsExponents,
            unblindedPublicKeys,
          )
        })

        const results: any = await promiseAll(promises)

        expect(results.length).toBe(n)
        expect(results.every((result: any) => result.status === 'ok')).toBeTruthy()

        results.map(
          (result: { status: string; sum?: string; message?: string; idx?: number }, i: number) => {
            if (result.status === 'ok') {
              services[i].decryptedShadowsSum = result.sum
            } else {
              loggerService.log(result)
            }
          },
        )
      })
      it('should restore common private key', async () => {
        const commonPrivateKey =
          services.reduce(
            (acc: bigint, service: { privateKey: bigint }) => acc + BigInt(service.privateKey),
            0n,
          ) % BigInt(paramSet.q)
        const decryptedShadowsSums = services.map(
          (service: { decryptedShadowsSum: PartiallyDecrypted }) => service.decryptedShadowsSum,
        )
        const result: any = await cryptoService.restoreCommonPrivateKey(
          indexes,
          decryptedShadowsSums,
        )
        expect(commonPrivateKey).toEqual(BigInt(result.commonSecret))
      })
    })

    describe('Encryption', () => {
      bulletins = Array(voters)
        .fill(0)
        .map(() => [1, ...Array(bulletinLength - 1).fill(0)].sort(() => Math.random() - 0.5))
      const chunks = chunk(bulletins, threads)

      it('should encrypt some votes', async () => {
        // tslint:disable-next-line:prefer-for-of
        for (let ch = 0; ch < chunks.length; ch++) {
          const promises = chunks[ch].map(async (bulletin: number[]) =>
            cryptoService.makeEncryptedBulletin(bulletin, mainKey),
          )
          encryptedBulletins.push(...(await promiseAll(promises)) as EncryptedBulletin[])
        }
      })
      it.skip('should encrypt on JS some votes', () => {
        const { q, hashLength, basePoint, pedersenBase } = paramSet
        const enc = new Encrypt({
          q,
          hashLength,
          mainKey,
          basePoint,
          pedersenBase,
        })

        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < bulletins.length; i++) {
          encryptedBulletins.push(enc.makeEncryptedBulletin(bulletins[i]) as any)
        }
      })
      it.skip('should verify and filter correct encrypted bulletins', async () => {
        const promises = encryptedBulletins.map(async (encryptedBulletin) => cryptoService.verifyEncryptedBulletin(encryptedBulletin, mainKey))

        const result: any = await promiseAll(promises)

        // @ts-ignore
        verifiedBulletins = result.map(({ verified }, i) => {
          return verified ? encryptedBulletins[i] : undefined
        })
        expect(verifiedBulletins.length).toBe(encryptedBulletins.length)
      })
    })

    describe('Decryption', () => {
      it('should calculate sum_A for all valid bulletins', async () => {
        const verified = await cryptoService.verifyEncryptedBulletins(encryptedBulletins, mainKey)
        verifiedBulletins = encryptedBulletins.filter((_, idx) => verified[idx])
        bulletinsSum = await cryptoService.addEncryptedBulletins(verifiedBulletins, mainKey, bulletinsSum)
        // bulletinsSum = await cryptoService.subtractEncryptedBulletins([verifiedBulletins[0]], mainKey, bulletinsSum)
        // bulletinsSum = await cryptoService.addEncryptedBulletins([verifiedBulletins[0]], mainKey, bulletinsSum)
        expect(bulletinsSum.sum_A).toBeDefined()
        expect(bulletinsSum.sum_B).toBeDefined()
      })
      it('should partially decrypt votes', async () => {
        const promises = services.map(
          async (service: IKeys) =>
            service.decryptedShadowsSum &&
            cryptoService.partiallyDecryptSumA(bulletinsSum.sum_A, service.decryptedShadowsSum),
        )
        const results = (await promiseAll(promises)) as PartiallyDecrypted[][]
        expect(results.length).toBe(n)
        expect(results.some((result) => !result)).toBeFalsy()
        results.map((partiallyDecrypted, i) => (services[i].partiallyDecrypted = partiallyDecrypted))
      })
      if (process.env.CONTRACT_TYPE === 'blind') {
        it(`BLIND: should decrypt commission part`, async () => {
          commissionDecrypt = await cryptoService.partiallyDecryptSumA(bulletinsSum.sum_A, randomKeyPair.privateKey)
          expect(commissionDecrypt).toBeTruthy()
        })
        it(`BLIND: should validate equality of dl`, async () => {
          const verified = await cryptoService.verifyEqualityOfDl(commissionDecrypt, bulletinsSum.sum_A, randomKeyPair.publicKey)
          expect(verified).toBeTruthy()
        })
      }
      it('should calculate voting results and compare it', async () => {
        const { sum_A, sum_B } = bulletinsSum
        const partialDecrypts = services.map(
          (service: { partiallyDecrypted: PartiallyDecrypted }) => service.partiallyDecrypted,
        )
        const polynomialCoefficientsExponents = services.map(
          (service: { polynomialCoefficientsExponents: Point[][] }) =>
            service.polynomialCoefficientsExponents,
        )
        const votersNum = encryptedBulletins.length
        const optionsNum = encryptedBulletins[0][0].length

        let result: number[]
        if (process.env.CONTRACT_TYPE === 'blind') {
          result = await cryptoService.calculateVotingResultRTK(
            indexes,
            votersNum,
            optionsNum,
            polynomialCoefficientsExponents,
            sum_A,
            sum_B,
            partialDecrypts,
            decryptKey,
            randomKeyPair.publicKey,
            commissionDecrypt,
          )
        } else {
          result = await cryptoService.calculateVotingResult(
            indexes,
            votersNum,
            optionsNum,
            polynomialCoefficientsExponents,
            sum_A,
            sum_B,
            partialDecrypts,
            mainKey,
          )
        }

        const sumVotes = bulletins.reduce(
          (acc, el) => el.map((vote, i) => acc[i] + vote),
          Array(bulletinLength).fill(0),
        )
        expect(result).toEqual(sumVotes)
        console.log(result, sumVotes)
      })
    })
  })
})
