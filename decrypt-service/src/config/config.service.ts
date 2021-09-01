import { readFileSync } from 'fs'
import { version } from '../../package.json'
import { IS_DECRYPT, IS_MAIN } from '../common/constants'
import { parseArrayEnv } from '../common/parseArrayEnv'
import { config } from 'dotenv'

config()

const buildInfo = getBuildInfo()

interface BuildInfo {
  BUILD_ID: string
  GIT_COMMIT: string
  DOCKER_TAG: string
}

function getBuildInfo(): BuildInfo {
  let build: any = {
    BUILD_ID: 'development',
    GIT_COMMIT: 'development',
    DOCKER_TAG: 'development',
  }
  try {
    const info = readFileSync('versions.json').toString()
    build = { ...build, ...JSON.parse(info) }
  } catch (err) {
    console.error('not found versions.json', err.message)
  }

  return build
}

export const isValidEnv = (env: { [key: string]: any }) => {
  return Object.keys(env).reduce((isValid: boolean, key: string) => {
    if (env[key] === undefined || Number.isNaN(env[key])) {
      console.error(`Please set correct config/env variable: ${key}`)
      return false
    }
    return isValid
  }, true)
}

const index = process.env.HOSTNAME ? Number(process.env.HOSTNAME.split('-').pop()) : 0
if (!Number.isInteger(index)) {
  console.error(`Invalid env HOSTNAME ${process.env.HOSTNAME}`)
  process.exit(1)
}

function getRequiredEnv() {
  return {
    POSTGRES_USER: process.env.POSTGRES_USER as string,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD as string,
    POSTGRES_DB: parseArrayEnv(process.env.POSTGRES_DB, 'POSTGRES_DB')[index] as string,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_HOST: process.env.POSTGRES_HOST as string,
    CRAWLER_POSTGRES_USER: process.env.CRAWLER_POSTGRES_USER as string,
    CRAWLER_POSTGRES_PASSWORD: process.env.CRAWLER_POSTGRES_PASSWORD as string,
    CRAWLER_POSTGRES_DB: parseArrayEnv(process.env.CRAWLER_POSTGRES_DB, 'CRAWLER_POSTGRES_DB')[index] as string,
    CRAWLER_POSTGRES_PORT: process.env.CRAWLER_POSTGRES_PORT as string,
    CRAWLER_POSTGRES_HOST: process.env.CRAWLER_POSTGRES_HOST as string,
    CRYPTO_SERVICE_ADDRESS:
      parseArrayEnv(process.env.CRYPTO_SERVICE_ADDRESS, 'CRYPTO_SERVICE_ADDRESS')[index] as string,
    NODE_ADDRESS: process.env.NODE_ADDRESS as string,
    AUTH_SERVICE_ADDRESS: process.env.AUTH_SERVICE_ADDRESS as string,
    PRIVATE_KEY: parseArrayEnv(process.env.PRIVATE_KEY, 'PRIVATE_KEY')[index] as string,
    PUBLIC_KEY: parseArrayEnv(process.env.PUBLIC_KEY, 'PUBLIC_KEY')[index] as string,
    SERVICE_TOKEN: parseArrayEnv(process.env.SERVICE_TOKEN, 'SERVICE_TOKEN')[index] as string,
    CONTRACT_TYPE: ((['common', 'blind'].includes(process.env.CONTRACT_TYPE as string) && process.env.CONTRACT_TYPE) ||
      undefined) as string,
    CONTRACT_IMAGE: process.env.CONTRACT_IMAGE as string,
    CONTRACT_IMAGE_HASH: process.env.CONTRACT_IMAGE_HASH as string,
    SERVER_CONFIG: parseArrayEnv(process.env.SERVER_CONFIG, 'SERVER_CONFIG'),
    DECRYPT_PUBLIC_KEYS: parseArrayEnv(process.env.PUBLIC_KEY, 'PUBLIC_KEY') as string[],
    MAIN_WALLET_PUBLIC_KEY: process.env.MAIN_WALLET_PUBLIC_KEY as string,
    MAIN_WALLET_PRIVATE_KEY: process.env.MAIN_WALLET_PRIVATE_KEY as string,
    SERVICE_TRANSFER_AMOUNT: process.env.SERVICE_TRANSFER_AMOUNT && +process.env.SERVICE_TRANSFER_AMOUNT * 1e8,
    MINIMAL_SERVICE_BALANCE: process.env.MINIMAL_SERVICE_BALANCE && +process.env.MINIMAL_SERVICE_BALANCE * 1e8,
    ENCRYPT_PRIVATE_KEYS_SALT: process.env.ENCRYPT_PRIVATE_KEYS_SALT as string,
  }
}

function prepareEnv() {
  const requiredEnv = getRequiredEnv()

  if (!isValidEnv(requiredEnv)) {
    return process.exit(1)
  }
  return {
    ...requiredEnv,
    PORT: process.env.PORT,
    GIT_COMMIT: buildInfo.GIT_COMMIT,
    BUILD_ID: buildInfo.BUILD_ID,
    DOCKER_TAG: buildInfo.DOCKER_TAG,
    IS_MAIN: !!(requiredEnv.SERVER_CONFIG[index] & IS_MAIN),
    IS_DECRYPT: !!(requiredEnv.SERVER_CONFIG[index] & IS_DECRYPT),
    POSTGRES_ENABLE_SSL: process.env.POSTGRES_ENABLE_SSL === 'true',
    CRAWLER_POSTGRES_ENABLE_SSL: process.env.CRAWLER_POSTGRES_ENABLE_SSL === 'true',
    BLIND_SIGNATURE_VERIFY: process.env.BLIND_SIGNATURE_VERIFY === 'true',
    BALANCE_WATCHER_ENABLED: process.env.BALANCE_WATCHER_ENABLED === 'true',
    TX_SUCCESS_TIMEOUT: (process.env.TX_SUCCESS_TIMEOUT && +process.env.TX_SUCCESS_TIMEOUT) || 60000,
    VOTING_HOLD_TIMEOUT: (process.env.VOTING_HOLD_TIMEOUT && +process.env.VOTING_HOLD_TIMEOUT) || 15000,
    DEAD_VOTING_TIMEOUT: (process.env.DEAD_VOTING_TIMEOUT && +process.env.DEAD_VOTING_TIMEOUT) || 1200000,
    DKG_STEP_TIMEOUT: (process.env.DKG_STEP_TIMEOUT && +process.env.DKG_STEP_TIMEOUT) || 300000,
    POSSIBLE_VOTES_NUM: (process.env.POSSIBLE_VOTES_NUM && +process.env.POSSIBLE_VOTES_NUM) || 1,
    BULLETINS_CHUNK_SIZE: (process.env.BULLETINS_CHUNK_SIZE && +process.env.BULLETINS_CHUNK_SIZE) || 5000,
    MIN_DATE_START_INTERVAL: (process.env.MIN_DATE_START_INTERVAL && +process.env.MIN_DATE_START_INTERVAL) || 300000,
    CRAWLER_LAG: (process.env.CRAWLER_LAG && +process.env.CRAWLER_LAG) || 5,
    ROLLBACK_CHECK_BLOCKS_AMOUNT:
      (process.env.ROLLBACK_CHECK_BLOCKS_AMOUNT && +process.env.ROLLBACK_CHECK_BLOCKS_AMOUNT) || 1000,
    BLIND_SIGNATURE_CHUNK_SIZE:
      (process.env.BLIND_SIGNATURE_CHUNK_SIZE && +process.env.BLIND_SIGNATURE_CHUNK_SIZE) || 8,
    DEAD_CRAWLER_TIMEOUT: process.env.DEAD_CRAWLER_TIMEOUT && +process.env.DEAD_CRAWLER_TIMEOUT || 300000,
    CONTRACT_NAME: process.env.CONTRACT_NAME,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
    HOSTNAME: process.env.HOSTNAME,
    SWAGGER_BASE_PATH: parseArrayEnv(process.env.SWAGGER_BASE_PATH, 'SWAGGER_BASE_PATH')[index] || '/',
  }
}

export class ConfigService {
  private readonly envConfig = prepareEnv()
  private readonly dbName: string

  constructor(dbName?: string) {
    config()
    if (dbName) {
      this.dbName = dbName
    }
  }

  getServerConfig(): number[] {
    return this.envConfig.SERVER_CONFIG
  }

  getContractType() {
    return this.envConfig.CONTRACT_TYPE
  }

  getContractName() {
    return this.envConfig.CONTRACT_NAME
  }

  getContractImage() {
    return this.envConfig.CONTRACT_IMAGE
  }

  getContractImageHash() {
    return this.envConfig.CONTRACT_IMAGE_HASH
  }

  getNodeUrl() {
    return `${this.envConfig.NODE_ADDRESS}`
  }

  getAuthUrl() {
    return this.envConfig.AUTH_SERVICE_ADDRESS
  }

  getCryptoUrl() {
    return this.envConfig.CRYPTO_SERVICE_ADDRESS
  }

  getAuthToken() {
    return this.envConfig.SERVICE_TOKEN
  }

  getPort() {
    return Number(this.envConfig.PORT)
  }

  getBalanceWatcherEnabled() {
    return this.envConfig.BALANCE_WATCHER_ENABLED as boolean
  }

  getRollbackCheckBlocksAmount() {
    return this.envConfig.ROLLBACK_CHECK_BLOCKS_AMOUNT
  }

  getLogLevel() {
    let logLevel = ['error', 'warn', 'log', 'debug']
    if (this.envConfig.LOG_LEVEL) {
      logLevel = this.envConfig.LOG_LEVEL.trim()
        .replace(/ +/g, '')
        .split(',')
        .map((s) => s.trim())
    }
    return logLevel
  }

  getEncryptionSalt() {
    return this.envConfig.ENCRYPT_PRIVATE_KEYS_SALT
  }

  getTxSuccessTimeout() {
    return this.envConfig.TX_SUCCESS_TIMEOUT
  }

  getVotingHoldTimeout() {
    return this.envConfig.VOTING_HOLD_TIMEOUT
  }

  getDeadVotingTimeout() {
    return this.envConfig.DEAD_VOTING_TIMEOUT
  }

  getDkgStepTimeout() {
    return this.envConfig.DKG_STEP_TIMEOUT
  }

  getDeadCrawlerTimeout() {
    return this.envConfig.DEAD_CRAWLER_TIMEOUT
  }

  getSwaggerBasePath() {
    return this.envConfig.SWAGGER_BASE_PATH || ''
  }

  getPgOptions() {
    return {
      host: this.envConfig.POSTGRES_HOST,
      port: Number(this.envConfig.POSTGRES_PORT),
      username: this.envConfig.POSTGRES_USER,
      password: this.envConfig.POSTGRES_PASSWORD,
      database: this.dbName || this.envConfig.POSTGRES_DB,
      ssl: this.envConfig.POSTGRES_ENABLE_SSL,
    }
  }

  getCrawlerPgOptions() {
    return {
      host: this.envConfig.CRAWLER_POSTGRES_HOST,
      port: Number(this.envConfig.CRAWLER_POSTGRES_PORT),
      username: this.envConfig.CRAWLER_POSTGRES_USER,
      password: this.envConfig.CRAWLER_POSTGRES_PASSWORD,
      database: this.envConfig.CRAWLER_POSTGRES_DB,
      ssl: this.envConfig.CRAWLER_POSTGRES_ENABLE_SSL,
    }
  }

  getMinimalServiceBalance() {
    return this.envConfig.MINIMAL_SERVICE_BALANCE as number
  }

  getServiceTransferAmount() {
    return this.envConfig.SERVICE_TRANSFER_AMOUNT as number
  }

  getPossibleVotesNum() {
    return this.envConfig.POSSIBLE_VOTES_NUM
  }

  getMainWalletPublicKey() {
    return this.envConfig.MAIN_WALLET_PUBLIC_KEY
  }

  getMainWalletPrivateKey() {
    return this.envConfig.MAIN_WALLET_PRIVATE_KEY
  }

  getDecryptPublicKeys(): string[] {
    return this.envConfig.DECRYPT_PUBLIC_KEYS
  }

  getPublicKey() {
    return this.envConfig.PUBLIC_KEY
  }

  getPrivateKey() {
    return this.envConfig.PRIVATE_KEY
  }

  getBulletinChunkSize() {
    return this.envConfig.BULLETINS_CHUNK_SIZE
  }

  getCrawlerLag() {
    return this.envConfig.CRAWLER_LAG
  }

  getMinDateStartInterval() {
    return this.envConfig.MIN_DATE_START_INTERVAL
  }

  getBlindSignatureChunkSize() {
    return this.envConfig.BLIND_SIGNATURE_CHUNK_SIZE
  }

  getBlindSignatureVerify() {
    return this.envConfig.BLIND_SIGNATURE_VERIFY
  }

  getVersionInfo() {
    return {
      version,
      commit: this.envConfig.GIT_COMMIT,
      build: this.envConfig.BUILD_ID,
      tag: this.envConfig.DOCKER_TAG,
      decryptIndex: index,
      publicKey: this.envConfig.PUBLIC_KEY,
      serviceToken: this.envConfig.SERVICE_TOKEN,
      contractName: this.envConfig.CONTRACT_NAME,
      contractImage: this.getContractImage(),
      contractImageHash: this.getContractImageHash(),
      bulletinsChunkSize: this.getBulletinChunkSize(),
      dkgStepTimeout: this.getDkgStepTimeout(),
      getDeadVotingTimeout: this.getDeadVotingTimeout(),
      txSuccessTimeout: this.getTxSuccessTimeout(),
      votingHoldTimeout: this.getVotingHoldTimeout(),
      crawlerLag: this.getCrawlerLag(),
      isMain: this.isMainServer(),
      isDecrypt: this.isDecryptServer(),
    }
  }

  isMainServer() {
    return this.envConfig.IS_MAIN
  }

  isDecryptServer() {
    return this.envConfig.IS_DECRYPT
  }

  isDev() {
    return this.envConfig.NODE_ENV === 'development'
  }
}
