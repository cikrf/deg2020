import { Injectable } from '@nestjs/common'
import { KeyPair, Point } from '../../crypto/interfaces'
import { ConfigService } from '../../config/config.service'
import { ContractKey, NodeService } from './node.service'
import { MIN_CONTRACT_STATE_UPDATE_INTERVAL } from '../../common/constants'
import { DecryptionStatus } from '../../entities/decryption.entity'
import { LoggerService } from '../../logger/logger.service'
import { getDateFromStr } from '../../common/dateUtils'

export type ServerState = {
  pubKey: string
  status: 'Active' | 'Blocked'
  decrypted: boolean
  description: string
  type: 'Server' | 'MainServer'
  i: number
  dkgCommit: string
  dkgScalar: string
  dkgShadows: string
  dkgExponents: string
  dkgComplaints: string[]
  dkgRound: number
}

type VotingBase = {
  pollType: string
  title: string
  dkgRound: number
  dimension: string
  dateStart: string
  dateEnd?: string
  status: string
  bulletinHash: string
  blindSigModulo?: string
  blindSigExponent?: string
  k: number
}

enum PublicDecryptionStatus {
  active = 'active',
  dkgCommitReady = 'dkgCommitReady',
  dkgScalarReady = 'dkgScalarReady',
  dkgShadowsReady = 'dkgShadowsReady',
  decryptionReady = 'decryptionReady',
  banned = 'banned',
}

export type ServerPublicStatus = {
  id: number,
  pubKey: string,
  status: PublicDecryptionStatus,
}

export class ContractState {
  private base: VotingBase
  private servers: ServerState[]
  private rawServers: ServerState[]
  private mainKey: Point
  private progress: { prev: number; round: number; updatedAt: Date } = {
    prev: 0,
    round: 0,
    updatedAt: new Date(),
  }

  constructor(
    private readonly contractId: string,
    private readonly publicKey: string,
    private readonly dkgStepTimeout: number,
    private readonly nodeService: NodeService,
    private readonly loggerService: LoggerService,
  ) {}

  async load() {
    try {
      const state = await this.nodeService.getContractKeys(this.contractId, [
        'MAIN_KEY',
        'VOTING_BASE',
        'SERVERS',
      ])

      const parsed = this.parseContractKey(state, 'VOTING_BASE')
      this.base = parsed

      this.mainKey = this.parseContractKey(state, 'MAIN_KEY')

      const serversKeys = this.parseContractKey(state, 'SERVERS')

      if (serversKeys) {
        try {
          const decryptKeys = serversKeys.map((s: string) => {
            const str = s.split('_')
            return 'DECRYPTION_' + str[1]
          })
          const stateServers = await this.nodeService.getContractKeys(this.contractId, [
            ...serversKeys,
            ...decryptKeys,
          ])

          this.rawServers = stateServers
            .filter((contractKey) => contractKey.key.split('_')[0] === 'SERVER')
            .map((contractKey) => JSON.parse(contractKey.value))
            // tslint:disable-next-line:no-object-literal-type-assertion
            .map((server) => ({
              ...server,
              decrypted: stateServers.some(({ key }) => key === `DECRYPTION_${server.pubKey}`),
            } as ServerState))
            .sort((a, b) => a.i - b.i)

          this.servers = this.rawServers
            .filter((server) => server.status === 'Active')

          const progress = this.servers.map(this.getDkgProgress)
          if (progress.reduce((a, b) => a + b) !== this.progress.prev) {
            this.progress = {
              prev: progress.reduce((a, b) => a + b),
              round: this.getDkgRound(),
              updatedAt: new Date(),
            }
          }
        } catch (err) {
          const error = (err && err.message) || err
          this.loggerService.error(error, '', 'ContractStateService')
          this.servers = []
          this.progress = { prev: 0, round: -1, updatedAt: new Date() }
        }
      }
    } catch (err) {
      const error = (err && err.message) || err
      this.loggerService.error(error, '', 'ContractStateService')
    }
  }

  private parseContractKey(contractKeys: ContractKey[], key: string) {
    const rawKey = contractKeys.find((ctr) => ctr.key === key && ctr.value && ctr.value.length)
    try {
      return rawKey ? JSON.parse(rawKey.value) : undefined
    } catch (err) {
      return undefined
    }
  }

  getDkgProgress(server: ServerState): number {
    const { dkgCommit, dkgScalar, dkgShadows } = server
    return +!!dkgCommit + +!!dkgScalar + +!!dkgShadows
  }

  hasStalledServers(): boolean {
    return (
      !this.isAllShadowsPublished() &&
      this.progress.updatedAt < new Date(Date.now() - this.dkgStepTimeout)
    )
  }

  resetStalledTimer() {
    this.progress.updatedAt = new Date()
  }

  getStalledServer() {
    const minStep = Math.min(...this.servers.map(this.getDkgProgress))
    return this.servers
      .map((server) => ({ pubKey: server.pubKey, step: this.getDkgProgress(server) }))
      .filter(({ step }) => step === minStep)
      .map((server) => server.pubKey)
  }

  getMainKey(): Point {
    return this.mainKey
  }

  getTitle(): string {
    return this.base ? this.base.title : ''
  }

  getStatus(): string {
    return this.base ? this.base.status : ''
  }

  getBulletinHash(): string {
    return this.base ? this.base.bulletinHash : ''
  }

  getDkgRound(): number {
    return this.base && this.base.dkgRound ? +this.base.dkgRound : 0
  }

  getDateStart(): Date {
    return this.base ? getDateFromStr(this.base.dateStart) : new Date(0)
  }

  getDateEnd(): Date | undefined {
    return this.base && this.base.dateEnd && getDateFromStr(this.base.dateEnd) || undefined
  }

  getK() {
    return +this.base.k
  }

  getBlindSigModulo(): string | undefined {
    return this.base && this.base.blindSigModulo ? this.base.blindSigModulo : undefined
  }

  getBlindSigExponent(): string | undefined {
    return this.base && this.base.blindSigExponent ? this.base.blindSigExponent : undefined
  }

  recoverStatus(): DecryptionStatus {
    const server = this.servers.find((s) => s.pubKey === this.publicKey)
    if (!server) {
      return DecryptionStatus.disabled
    } else if (server.decrypted) {
      return DecryptionStatus.decrypted
    } else if (server.dkgShadows) {
      return DecryptionStatus.dkgShadows
    } else if (server.dkgScalar) {
      return DecryptionStatus.dkgScalar
    } else if (server.dkgCommit) {
      return DecryptionStatus.dkgCommit
    } else {
      return DecryptionStatus.round
    }
  }

  getOwnI(): number {
    const idx = this.getOwnIndex()
    return this.servers[idx].i
  }

  getOwnIndex(): number {
    return this.servers.findIndex((server) => server.pubKey === this.publicKey)
  }

  getDkgCommits(): Point[] {
    return this.servers.map((server) => {
      const point = JSON.parse(server.dkgCommit)
      return [point.x, point.y] as Point
    })
  }

  getDkgScalars(): string[] {
    return this.servers.map((server) => server.dkgScalar)
  }

  getDkgShadows(): KeyPair[] {
    const idx = this.getOwnIndex()
    return this.servers.map((server) => {
      const shadows = Object.values(JSON.parse(server.dkgShadows))
      return shadows[idx] as KeyPair
    })
  }

  getDkgExponents(): Point[][] {
    return this.servers.map((server) => Object.values(JSON.parse(server.dkgExponents)))
  }

  getPublicKeyOfServer(i: number): string {
    return this.servers[i].pubKey
  }

  getDkgComplaints(): string[] {
    return this.servers.flatMap((server) => server.dkgComplaints)
  }

  isServerActive(): boolean {
    const server = this.servers.find((s) => s.pubKey === this.publicKey)
    return !!(server && server.status === 'Active')
  }

  isAllCommitsPublished(): boolean {
    return this.isAllDecryptsPublished(this.base.dkgRound, 'dkgCommit')
  }

  isAllScalarsPublished(): boolean {
    return this.isAllDecryptsPublished(this.base.dkgRound, 'dkgScalar')
  }

  isAllShadowsPublished(): boolean {
    return this.isAllDecryptsPublished(this.base.dkgRound, 'dkgShadows')
  }

  isComplaintsPublished(): boolean {
    return this.isSomeDecryptsPublished(this.base.dkgRound, 'dkgComplaints')
  }

  getPublicDecryptionStatus(): ServerPublicStatus[] {
    return this.rawServers.map((server) => ({
      id: server.i,
      pubKey: server.pubKey,
      status: this.getServerDecryptionStatus(server),
    }))
  }

  isDecryptionDelivered(): boolean {
    const server = this.servers.find((s) => s.pubKey === this.publicKey)
    return server ? server.decrypted : false
  }

  getServers(): ServerState[] {
    return this.servers
  }

  getUpdatedServerList(publicKeys: string[]): ServerState[] {
    // don't ban itself when main
    publicKeys = publicKeys.filter((publicKey) => publicKey !== this.publicKey)
    return this.rawServers
      .map(
        (server) =>
          ({
            type: server.type,
            pubKey: server.pubKey,
            description: server.description,
            status:
              server.status === 'Blocked'
                ? server.status
                : publicKeys.includes(server.pubKey)
                ? 'Blocked'
                : ('Active' as any),
          } as any),
      )
      .sort((a, b) => {
        if (a.type < b.type) {
          return -1
        } else if (a.status < b.status) {
          return -1
        } else if (a.status > b.status) {
          return 1
        } else {
          return 0
        }
      })
      .map((server, i) => {
        return {
          ...server,
          i,
        }
      })
  }

  private getServerDecryptionStatus(server: ServerState): PublicDecryptionStatus {
    if(server.status === 'Blocked'){
      return PublicDecryptionStatus.banned
    }
    if (server.decrypted) {
      return PublicDecryptionStatus.decryptionReady
    }
    if (server.dkgShadows) {
      return PublicDecryptionStatus.dkgShadowsReady
    }
    if (server.dkgScalar) {
      return PublicDecryptionStatus.dkgScalarReady
    }
    if (server.dkgCommit) {
      return PublicDecryptionStatus.dkgCommitReady
    }

    return PublicDecryptionStatus.active
  }

  private isAllDecryptsPublished(round: number, key: keyof ServerState): boolean {
    return this.servers.every((server) => {
      const keyNotEmpty = typeof server[key] === 'object' ? Object.keys(server[key]).length > 0 : server[key] !== ''
      return keyNotEmpty && server.dkgRound === round
    })
  }

  private isSomeDecryptsPublished(round: number, key: keyof ServerState): boolean {
    return this.servers.some((server) => {
      const keyNotEmpty = typeof server[key] === 'object' ? Object.keys(server[key]).length > 0 : server[key] !== ''
      return keyNotEmpty && server.dkgRound === round
    })
  }

  isFinished() {
    const dateEnd = this.getDateEnd()
    return dateEnd && dateEnd < new Date()
  }
}

type Loading = {
  loading: boolean
  promise: Promise<any>
  subs: Set<string>
}

type ContractMapValue = {
  contractState: ContractState
  subs: Set<string>
  lastUpdatedAt: Date
}

@Injectable()
export class ContractStateService {
  private contractsCache: Map<string, Loading | ContractMapValue> = new Map()

  constructor(
    private readonly configService: ConfigService,
    private readonly nodeService: NodeService,
    private readonly loggerService: LoggerService,
  ) {}

  private async loadState(contractId: string) {
    const contract = new ContractState(
      contractId,
      this.configService.getPublicKey(),
      this.configService.getDkgStepTimeout(),
      this.nodeService,
      this.loggerService,
    )
    await contract.load()
    return contract
  }

  async addToCache(contractId: string, label: string): Promise<void> {
    const cache = this.contractsCache.get(contractId)
    if (!cache) {
      const loadingPromise = this.loadState(contractId)
      const subs = new Set<string>()
      subs.add(label)
      this.contractsCache.set(contractId, { loading: true, promise: loadingPromise, subs })
      const contractState = await loadingPromise

      const lastCache = this.contractsCache.get(contractId)

      if (!lastCache) {
        // cache was already deleted
        return
      }

      this.contractsCache.set(contractId, {
        contractState,
        subs: lastCache.subs,
        lastUpdatedAt: new Date(),
      })
    } else {
      cache.subs.add(label)
      if ('loading' in cache) {
        await cache.promise
      }
    }
  }

  removeFromCache(contractId: string, label: string): void {
    const cache = this.contractsCache.get(contractId)
    if (!cache) {
      this.loggerService.debug(`Attempting to remove undefined contract ${contractId} from ${label}`, 'ContractStateService')
      return
    }

    cache.subs.delete(label)
    if (!cache.subs.size) {
      this.contractsCache.delete(contractId)
    }
  }

  getCachedState(contractId: string): ContractState | null {
    const cache = this.contractsCache.get(contractId)
    if (!cache || 'loading' in cache) {
      return null
    }

    return cache.contractState
  }

  getActualState(contractId: string) {
    const cache = this.contractsCache.get(contractId)
    if (cache && !('loading' in cache) && Date.now() - cache.lastUpdatedAt.getTime() < MIN_CONTRACT_STATE_UPDATE_INTERVAL) {
      return Promise.resolve(cache.contractState)
    }

    return this.loadState(contractId)
  }
}
