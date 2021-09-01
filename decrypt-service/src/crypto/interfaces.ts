export interface IKeys {
  privateKey: string
  publicKey: Point
  publicKeyCommit: Point
  secretKeyOfCommit: string
}

export type PointObj = {
  x: string
  y: string
}

export type Point = [string, string]
export type KeyPair = { privateKey: string; publicKey: Point }
export type RangeProof = [Point, Point, Point, Point, Point, Point, string, string, string, string]

export type RangeProofWithoutAB = [Point, Point, Point, Point, string, string, string, string]

export type Polynomial = string[]

export interface IParamSet {
  a: string
  b: string
  p: string
  q: string
  basePoint: Point
  pedersenBase: Point
  hashLength: string
}

export type EncryptedBulletin = [RangeProof[], RangeProofWithoutAB]

export type PartiallyDecrypted = [Point, string, Point, Point]

export type EncryptedBulletinsSums = {
  sum_A: Point[]
  sum_B: Point[]
}

export interface ICryptoService {
  getBasePoint(): Promise<Point>

  getParamSet(): Promise<IParamSet>

  generateKeys(): Promise<IKeys>

  generatePolynomialCoefficients(privateKey: string, k: number): Promise<string[]>

  calculatePolynomialCoefficientsExponents(polynomialCoefficients: string[]): Promise<Point[]>

  unblindPublicKeys(publicKeysCommits: Point[], secretKeysOfCommits: string[]): Promise<Point[]>

  calculateMainKey(publicKeysCommits: Point[], secretKeysOfCommits: string[]): Promise<Point>

  validateMainKey(mainKey: Point, dimension: number[]): Promise<boolean>

  calculateEncryptedShadows(
    polynomialCoefficients: string[],
    unblindedPublicKeys: Point[],
  ): Promise<any>

  decryptAndCheckShadows(
    privateKey: string,
    idx: number,
    encryptedShadows: KeyPair[],
    polynomialCoefficientsExponents: Point[][],
    unblindedPublicKeys: Point[],
  ): Promise<any>

  restoreCommonPrivateKey(indexes: number[], decryptedShadowsSums: string[]): Promise<string>

  makeEncryptedBulletin(bulletin: number[], mainKey: Point): Promise<EncryptedBulletin>

  verifyEncryptedBulletin(encryptedBulletin: EncryptedBulletin, mainKey: Point): Promise<boolean>

  verifyEncryptedBulletins(
    encryptedBulletins: EncryptedBulletin[],
    mainKey: Point,
  ): Promise<EncryptedBulletin[]>

  addEncryptedBulletins(
    encryptedBulletins: EncryptedBulletin[],
    mainKey: Point,
    acc?: EncryptedBulletinsSums,
  ): Promise<EncryptedBulletinsSums>

  subtractEncryptedBulletins(
    encryptedBulletins: EncryptedBulletin[],
    mainKey: Point,
    acc: EncryptedBulletinsSums,
  ): Promise<EncryptedBulletinsSums>

  // tslint:disable-next-line:variable-name
  partiallyDecryptSumA(sum_A: Point[], decryptedShadowsSum: string): Promise<PartiallyDecrypted[]>

  // tslint:disable-next-line:variable-name
  calculateVotingResult(
    indexes: number[],
    votersNum: number,
    questionsNum: number,
    polynomialCoefficientsExponents: Point[][],
    // tslint:disable-next-line:variable-name
    sum_A: Point[],
    // tslint:disable-next-line:variable-name
    sum_B: Point[],
    partialDecrypts: PartiallyDecrypted[][],
    mainKey: Point,
  ): Promise<number[]>

  pointValidate(point: Point, curve: string): Promise<boolean>

  addCommissionPubKey(decryptKey: Point, commissionPubKey: Point): Promise<Point>

  generateKeyPair(format: string): Promise<KeyPair>

  // tslint:disable-next-line:variable-name
  verifyEqualityOfDl(decrypts: PartiallyDecrypted[], sum_A: Point[], publicKey: Point): Promise<boolean>

  validatePrivateKey(publicKey: Point, privateKey: string): Promise<boolean>

  // tslint:disable-next-line:variable-name
  calculateVotingResultRTK(
    indexes: number[],
    votersNum: number,
    questionsNum: number,
    polynomialCoefficientsExponents: Point[][],
    // tslint:disable-next-line:variable-name
    sum_A: Point[],
    // tslint:disable-next-line:variable-name
    sum_B: Point[],
    partialDecrypts: PartiallyDecrypted[][],
    decryptKey: Point,
    commissionPubKey: Point,
    commissionDecrypt: PartiallyDecrypted[],
  ): Promise<number[]>

  blindSignatureVerifyRSA(
    signature: string,
    message: string,
    modulo: string,
    publicExp: string,
  ): Promise<boolean>

  blindSignatureGenerateRSA(message: string): Promise<any>
}
