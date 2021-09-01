import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '../../config/config.service'
import fetch from 'isomorphic-fetch'
import {
  AUTHORIZED_FETCH,
  KEEP_N_TX_STAT,
  NODE_CONFIG,
  TX_103,
  TX_104,
  VOTING_CONTRACT,
} from '../../common/constants'
import { Decryption } from '../../entities/decryption.entity'
import { KeyPair, PartiallyDecrypted, Point, PointObj } from '../../crypto/interfaces'
import { LoggerService } from '../../logger/logger.service'
import { calculateK } from '../../common/calculatek'
import { IWavesConfig } from '@vostokplatform/waves-api/interfaces'
import { MAINNET_CONFIG } from '@vostokplatform/waves-api'
import { NodeConfig } from '../../common/providers'
import { Main } from '../../entities/main.entity'
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { ContractStateService, ServerState } from './contract.state.service'
import { RtVotingContract, WeVotingContract } from '@vostokplatform/voting-contract-api'
import {
  IModifiedWavesApiResponse,
  INodeErrorResponse,
  INodeMinerSuccessResponse,
} from '@vostokplatform/voting-contract-api/dist/types/wavesApi'

type VotingContract = typeof RtVotingContract | typeof WeVotingContract

@Injectable()
export class ContractApiService {
  private readonly votingContractApi: WeVotingContract | RtVotingContract
  private readonly stat: { time: number[]; success: number; error: number } = {
    time: [],
    success: 0,
    error: 0,
  }
  private statNum: number = 0

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly contractStateService: ContractStateService,
    @Inject(VOTING_CONTRACT) private readonly votingContract: VotingContract,
    @Inject(AUTHORIZED_FETCH) private readonly authorizedFetch: typeof fetch,
    @Inject(NODE_CONFIG) private readonly nodeConfig: NodeConfig,
  ) {
    const logStat = new CronJob(CronExpression.EVERY_MINUTE, this.logStat.bind(this))
    this.schedulerRegistry.addCronJob('logStat', logStat)
    logStat.start()

    const weApiConfig: IWavesConfig = {
      ...MAINNET_CONFIG,
      nodeAddress: this.configService.getNodeUrl(),
      networkByte: this.nodeConfig.chainId.charCodeAt(0),
      crypto: this.nodeConfig.gostCrypto ? 'gost' : 'waves',
    }

    this.votingContractApi = new this.votingContract({
      weApiConfig,
      fetchInstance: this.authorizedFetch,
      keyPair: {
        privateKey: this.configService.getPrivateKey(),
        publicKey: this.configService.getPublicKey(),
      },
      statusResponseTimeout: this.configService.getTxSuccessTimeout(),
    })
  }

  private logStat() {
    const { success, error, avgTime } = this.getStat()
    if (this.statNum !== success + error) {
      this.loggerService.debug(`Success: ${success}. Error: ${error}. Average time: ${avgTime}s`, 'TxStat')
      this.statNum = success + error
    }
  }

  private getError(response?: INodeMinerSuccessResponse[] | INodeErrorResponse): string[] {
    if (!response) {
      return ['no status message']
    }
    if (Array.isArray(response)) {
      return [...new Set(response.map((r) => r.message))]
    } else {
      return [response.message]
    }
  }

  private addStat(start: number, result: IModifiedWavesApiResponse): void {
    const time = Date.now() - start
    if (result.success) {
      this.stat.success++
      this.loggerService.debug(`Tx ${result.data.id} mined in ${(time / 1000).toFixed(1)}s`, `TxStat`)
    } else {
      this.stat.error++
      this.loggerService.debug(
        `Tx ${result.data.id} not mined in ${(this.configService.getTxSuccessTimeout() / 1000).toFixed(1)}s`, `TxStat`,
      )
    }

    this.stat.time.push(time)
    if (this.stat.time.length > KEEP_N_TX_STAT) {
      this.stat.time.shift()
    }
  }

  getStat() {
    const avgTime = this.stat.time
      .reduce((acc, time) => acc + time / this.stat.time.length / 1000, 0)
      .toFixed(1)
    return {
      success: this.stat.success,
      error: this.stat.error,
      avgTime,
    }
  }

  async initiateVoting(request: any): Promise<string> {
    const weApiConfig: IWavesConfig = {
      ...MAINNET_CONFIG,
      nodeAddress: this.configService.getNodeUrl(),
      networkByte: this.nodeConfig.chainId.charCodeAt(0),
      crypto: this.nodeConfig.gostCrypto ? 'gost' : 'waves',
    }

    const votingContractApi = new this.votingContract({
      weApiConfig,
      fetchInstance: this.authorizedFetch,
      keyPair: {
        privateKey: this.configService.getPrivateKey(),
        publicKey: this.configService.getPublicKey(),
      },
      statusResponseTimeout: 1000,
    })

    const servers = this.configService.getDecryptPublicKeys().map((publicKey: string, idx) => ({
      i: idx + 1,
      pubKey: publicKey,
      description: `Decrypt ${idx}`,
      type: this.configService.getPublicKey() === publicKey ? 'main' as 'main' : 'decrypt' as 'decrypt',
    }))

    const contractParams = {
      pollId: request.pollId,
      pollType: request.type,
      dimension: request.dimension,
      k: calculateK(servers.length),
      bulletinHash: request.bulletinHash,
      servers,
    }
    const txParams = {
      fee: this.nodeConfig.minimumFee[TX_103],
      contractName: this.configService.getContractName() || 'voting-contract',
      image: this.configService.getContractImage(),
      imageHash: this.configService.getContractImageHash(),
    }

    if (request.type === 'blind') {
      const result = await (votingContractApi as RtVotingContract).initiateVoting({
        txParams,
        contractParams: {
          ...contractParams,
          basePoint: '',
          blindSigExponent: request.blindSigExponent,
          blindSigModulo: request.blindSigModulo,
          dateStart: new Date(request.dateStart),
        },
      })
      return result.data.id
    }

    if (request.type === 'common') {
      const result = await (votingContractApi as WeVotingContract).initiateVoting({
        txParams,
        contractParams: {
          ...contractParams,
          dateStart: new Date(request.dateStart),
          dateEnd: new Date(request.dateEnd),
          title: request.title,
          description: request.description,
          companyId: request.companyId,
          docs: [],
          admins: request.admins,
          participants: [],
        },
      })
      return result.data.id
    }

    throw new Error('Unknown contract type ' + request.type)
  }

  async dkgCommit({ contractId, publicKeyCommit, round }: Decryption): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.dkgCommit({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        commit: { x: publicKeyCommit[0], y: publicKeyCommit[1] },
        round,
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async dkgScalar({ contractId, secretKeyOfCommit, round }: Decryption): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.dkgScalar({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        scalar: secretKeyOfCommit,
        round,
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async dkgShadows(
    { contractId, round }: Decryption,
    exponents: Point[],
    shadows: KeyPair[],
  ): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.dkgShadows({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        shadows: shadows.reduce((acc, shadow, i) => ({
          ...acc,
          [i + 1]: shadow,
        }), {}),
        exponents: exponents.reduce((acc, exponent, i) => ({ ...acc, [i + 1]: exponent }), {}),
        round,
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async decryption({ contractId }: Decryption, decryption: PartiallyDecrypted[][]): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.decryption({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        decryption: JSON.stringify(decryption),
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async commissionDecryption({ contractId }: Main, decryption: PartiallyDecrypted[][]): Promise<void> {
    const start = Date.now()
    const response = await (this.votingContractApi as RtVotingContract).commissionDecryption({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        decryption: JSON.stringify(decryption),
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async dkgComplaint({ contractId, round }: Decryption, txId: string): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.dkgComplaint({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        round,
        txId,
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async addMainKey(contractId: string, round: number, mainKey: Point, dkgKey?: PointObj, commissionKey?: PointObj): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.addMainKey({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        round,
        mainKey: JSON.stringify(mainKey),
        commissionKey: commissionKey ? JSON.stringify(commissionKey) : undefined,
        dkgKey: dkgKey ? JSON.stringify(dkgKey) : undefined,
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async updateServerList({ contractId }: Main, servers: ServerState[]): Promise<void> {
    const state = await this.contractStateService.getActualState(contractId)
    const round = state.getDkgRound() + 1

    const start = Date.now()
    const response = await this.votingContractApi.updateServerList({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        k: calculateK(servers.filter((server) => server.status === 'Active').length),
        round,
        servers: servers.map((server, idx) => ({
          ...server,
          i: idx + 1,
          type: server.type,
        })),
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async result({ contractId, result }: Main): Promise<void> {
    const start = Date.now()
    const response = await this.votingContractApi.results({
      txParams: {
        fee: this.nodeConfig.minimumFee[TX_104],
        contractId,
      },
      contractParams: {
        results: JSON.stringify(result),
      },
    })
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async addParticipants({ contractId }: Main, publicKeys: string[]): Promise<void> {
    const start = Date.now()
    const response = await (this.votingContractApi as WeVotingContract).addParticipants({
      txParams: {
        contractId,
        fee: this.nodeConfig.minimumFee[TX_104],
      },
      contractParams: {
        participants: publicKeys,
      },
    })

    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }

  async finishVoting({ contractId }: Main): Promise<void> {
    const start = Date.now()
    let response: any
    try {
      response = await (this.votingContractApi as RtVotingContract).finishVoting({
        txParams: {
          fee: this.nodeConfig.minimumFee[TX_104],
          contractId,
        },
        contractParams: {},
      })
    } catch (err) {
      console.log(err)
    }
    this.addStat(start, response)
    if (!response.success) {
      const message = this.getError(response.status)
      throw new Error(message.join(', '))
    }
  }
}
