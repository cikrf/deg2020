import { Inject, Injectable, NotFoundException, OnApplicationBootstrap } from '@nestjs/common'
import { In, Not, Repository } from 'typeorm'
import { Main, MainStatus } from '../../entities/main.entity'
import { MAIN_REPOSITORY_TOKEN, MAX_VOTING_ERRORS, QUEUE_THREAD_DELAY, QUEUE_THREADS, SUMS_REPOSITORY_TOKEN } from '../../common/constants'
import { QueueManager } from './queue.manager'
import { sleep } from '../../common/sleep'
import { ContractState, ContractStateService, ServerPublicStatus } from './contract.state.service'
import { CrawlerService } from '../../crawler/crawler.service'
import { ContractApiService } from './contract.api.service'
import { CryptoService } from '../../crypto/crypto.service'
import { LoggerService } from '../../logger/logger.service'
import { ConfigService } from '../../config/config.service'
import { PartiallyDecrypted, Point, PointObj } from '../../crypto/interfaces'
import { Sums } from '../../entities/sums.entity'
import { JobsService } from '../../jobs/jobs.service'
import { CronExpression } from '@nestjs/schedule'
import * as BN from 'bn.js'
import { waitForUnlock } from '../../common/waitForUnlock'

const SERVICE_CACHE_LABEL = 'Main'

@Injectable()
export class MainService implements OnApplicationBootstrap {
  private votings: Main[] = []
  private mainQueue: QueueManager<Main>

  constructor(
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly loggerService: LoggerService,
    private readonly crawlerService: CrawlerService,
    private readonly contractApiService: ContractApiService,
    private readonly contractStateService: ContractStateService,
    private readonly jobsService: JobsService,
    @Inject(SUMS_REPOSITORY_TOKEN) private readonly sumsRepository: Repository<Sums>,
    @Inject(MAIN_REPOSITORY_TOKEN) private readonly mainRepository: Repository<Main>,
  ) {}

  async onApplicationBootstrap() {
    if (!this.configService.isMainServer()) {
      return
    }

    this.votings = await this.mainRepository.find({
      where: { status: Not(In([MainStatus.resultsFailed, MainStatus.resultsReady, MainStatus.pollFailed])) },
    })

    await Promise.all(
      this.votings.map(async ({ contractId }, i) => {
        await sleep(i * QUEUE_THREAD_DELAY)
        await this.contractStateService.addToCache(contractId, SERVICE_CACHE_LABEL)
      }),
    )

    this.mainQueue = new QueueManager<Main>(this.votings, this.mainQueueUpdater.bind(this))
    this.jobsService.addJob('mainActionsRunner', this.mainActionsRunner.bind(this), { concurrent: true })
    this.jobsService.addJob('cleanupMainVotings', this.cleanupMainVotings.bind(this))
    this.jobsService.addJob('crawlerDateEndMainWatcher', this.crawlerDateEndMainWatcher.bind(this), { cronTime: CronExpression.EVERY_10_SECONDS })
    this.jobsService.setMain(this)
  }

  crawlerDateEndMainWatcher() {
    this.votings
      .filter((voting) => !voting.dateEnd)
      .map(async (voting) => {
        const dateEnd = await this.crawlerService.getVotingDateEnd(voting.contractId)
        this.loggerService.verbose(`check ${voting.contractId} dateEnd ${dateEnd}`, 'MainService')
        if (dateEnd) {
          voting.dateEnd = dateEnd
          await this.mainRepository.update({ contractId: voting.contractId }, { dateEnd })
        }
      })
  }

  private mainQueueUpdater() {
    return this.votings
      .filter((voting) => voting.dateStart > new Date() || (voting.dateEnd && new Date() > voting.dateEnd))
      .filter((voting) => !(voting.status === MainStatus.dkgCompleted && !voting.commissionPubKey))
      .filter((voting) => !(voting.status === MainStatus.waitingCommissionKey))
      .filter((voting) => !voting.lock)
  }

  private async cleanupMainVotings() {
    await Promise.all(this.votings
      .filter((voting) =>
        (voting.dateEnd && voting.dateEnd < new Date(Date.now() - this.configService.getDeadVotingTimeout())) ||
        voting.errors > MAX_VOTING_ERRORS,
      ).map((main) => this.unsubscribe(main, main.status === MainStatus.pollHalted ? MainStatus.pollHalted : MainStatus.resultsFailed)))

    this.votings.filter((voting) => voting.lock &&
      voting.lockDate < new Date(Date.now() - this.configService.getTxSuccessTimeout() * 2))
      .map((voting) => {
        const contractId = voting.contractId
        const contractState = this.contractStateService.getCachedState(contractId)
        this.loggerService.debug(
          `[${(contractState && contractState.getTitle()) || 'unknown'}] Unlocking ${contractId}`, 'MainService',
        )
        voting.lock = false
      })
  }

  mainActionsRunner() {
    this.mainQueue.get(QUEUE_THREADS).map(async (voting, i) => {
      try {
        voting.lock = true
        voting.lockDate = new Date()

        await sleep(i * QUEUE_THREAD_DELAY)

        const votingIdx = this.votings.findIndex((v) => v.contractId === voting.contractId)
        if (votingIdx === -1) {
          // stop if voting was unsubed
          return
        }

        const contractId = voting.contractId
        const contractState = await this.contractStateService.getActualState(contractId)

        if (voting.dateStart > new Date() && !voting.dateEnd) {
          if (contractState.isComplaintsPublished()) {
            const txIds = contractState.getDkgComplaints()
            const complaintsPublicKeys = await this.crawlerService.getWrongShadowPublicKeys(txIds)
            const serverList = contractState.getUpdatedServerList(complaintsPublicKeys)
            this.loggerService.log(
              `[${contractState.getTitle()}] Banning cheating servers` +
              ` / round #${contractState.getDkgRound()} / ${contractId}`, 'MainService',
            )
            await this.contractApiService.updateServerList(voting, serverList)
          } else if (!contractState.isAllShadowsPublished() && contractState.hasStalledServers()) {
            const stalledPublicKeys = contractState.getStalledServer()
            const serverList = contractState.getUpdatedServerList(stalledPublicKeys)
            this.loggerService.log(
              `[${contractState.getTitle()}] Banning stalled servers` +
              ` / round #${contractState.getDkgRound()} / ${contractId}`, 'MainService',
            )
            await this.contractApiService.updateServerList(voting, serverList)
            contractState.resetStalledTimer()
          } else if (voting.status === MainStatus.dkgCompleted) {
            if (!contractState.getMainKey()) {
              const round = contractState.getDkgRound()
              if (this.configService.getContractType() === 'blind') {
                const mainKey = await this.cryptoService.addCommissionPubKey(voting.decryptKey, this.mapPointObj(voting.commissionPubKey))
                await this.sendMainKey(voting.contractId, round, mainKey, this.mapPointToObj(voting.decryptKey), voting.commissionPubKey)
              } else {
                await this.sendMainKey(voting.contractId, round, voting.decryptKey)
              }
            }
            this.loggerService.log(`[${contractState.getTitle()}] Set voting status pollActive / ${contractId}`, 'MainService')
            voting.status = MainStatus.pollActive
          } else if (voting.status === MainStatus.pollStarted && contractState.isAllShadowsPublished()) {
            const publicKeysCommits = contractState.getDkgCommits()
            const secretKeysOfCommits = contractState.getDkgScalars()

            const mainKey = await this.cryptoService.calculateMainKey(publicKeysCommits, secretKeysOfCommits)

            const round = contractState.getDkgRound()
            const isMainKeyValid = await this.cryptoService.validateMainKey(mainKey, voting.dimension)
            if (isMainKeyValid) {
              if (this.configService.getContractType() === 'blind') {
                this.loggerService.log(`[${contractState.getTitle()}] Decrypt key counted. Waiting for commission public key / round #${round} / ${contractId}`, 'MainService')
              } else {
                this.loggerService.log(`[${contractState.getTitle()}] All shadows published / round #${round} / ${contractId}`, 'MainService')
              }
              voting.decryptKey = mainKey
              voting.status = MainStatus.dkgCompleted
            } else {
              this.loggerService.log(`[${contractState.getTitle()}] Invalid MainKey / round #${round} / ${contractId}`, 'MainService')
              await this.startNewRound(voting)
            }
          }
        } else if (contractState.isFinished() && contractState.isDecryptionDelivered()) {

          const k = contractState.getK()
          const round = contractState.getDkgRound()
          let commissionDecryption: PartiallyDecrypted[]
          if (this.configService.getContractType() === 'blind') {
            const decryption = (await this.crawlerService.getCommissionDecryption(contractId))
            if (!decryption) {
              if (![MainStatus.waitingCommissionKey, MainStatus.prepareResults].includes(voting.status)) {
                voting.status = MainStatus.waitingCommissionKey
                await this.mainRepository.update(voting.contractId, { status: voting.status })
                this.loggerService.log(`[${contractState.getTitle()}] Waiting for commission decryption / round #${round} / ${contractId}`, 'MainService')
              }
              voting.lock = false
              return
            }
            commissionDecryption = decryption.value
          }
          const decryptions = await this.crawlerService.getDecryptions(contractId)

          const mainKey = contractState.getMainKey()
          if (decryptions.length >= k) {
            const servers = contractState.getServers().map((server) => {
              const decryption = decryptions.find((decrypt) => server.pubKey === decrypt.sender_public_key)
              return {
                ...server,
                decryption: decryption ? decryption.value : undefined,
              }
            })

            const indexes: number[] = servers
              .filter((server) => !!server.decryption)
              .map((server) => +server.i)
              .sort(() => Math.random() - 0.5)
              .splice(0, k)

            const exponents: Point[][] = contractState.getDkgExponents()

            const sums = await this.sumsRepository.findOneOrFail({
              where: { contractId },
              order: { index: 'DESC' },
            })

            const questions = voting.dimension.length
            voting.result = Array(questions).fill(0)
            for (let question = 0; question < questions; question++) {
              const decryption: PartiallyDecrypted[][] = servers.map((server) =>
                server.decryption ? server.decryption[question] : ([] as any),
              )
              const options = voting.dimension[question]
              // tslint:disable-next-line:variable-name
              const sum_A = sums!.A[question]
              // tslint:disable-next-line:variable-name
              const sum_B = sums!.B[question]
              const voted = sums!.voted
              if (this.configService.getContractType() === 'blind') {
                const { decryptKey, commissionPubKey } = voting
                // @ts-ignore
                voting.result[question] = await this.cryptoService.calculateVotingResultRTK(indexes, voted, options, exponents, sum_A, sum_B, decryption, decryptKey, this.mapPointObj(commissionPubKey), commissionDecryption[question])
              } else {
                voting.result[question] = await this.cryptoService.calculateVotingResult(indexes, voted, options, exponents, sum_A, sum_B, decryption, mainKey)
              }
            }
            this.loggerService.log(`[${contractState.getTitle()}] Sending results for ${contractId}`, 'MainService')
            await this.contractApiService.result(voting)

            await this.unsubscribe(voting, MainStatus.resultsReady)
          }
        }
      } catch (error) {
        const contractState = await this.contractStateService.getActualState(voting.contractId)

        this.loggerService.error(`[${contractState.getTitle()}] ${error.message} / round #${contractState.getDkgRound()} / ${voting.contractId}`, error, 'MainService')
        voting.errors++
      }
      await this.mainRepository.save(voting)
      voting.lock = false
    })
  }

  async startNewRound(voting: Main) {
    const contractState = await this.contractStateService.getActualState(voting.contractId)
    const serverList = contractState.getUpdatedServerList([])
    this.loggerService.log(`[${contractState.getTitle()}] Starting new round / round #${contractState.getDkgRound()} / ${voting.contractId}`, 'MainService')
    await this.contractApiService.updateServerList(voting, serverList)
  }

  private async sendMainKey(contractId: string, round: number, mainKey: Point, dkgKey?: PointObj, commissionKey?: PointObj) {
    this.loggerService.log(`Sending addMainKey / round #${round} / ${contractId}`, 'MainService')
    try {
      await this.mainRepository.update({ contractId }, { status: MainStatus.mainKeySent })
      await this.contractApiService.addMainKey(contractId, round, mainKey, dkgKey, commissionKey)
    } catch (err) {
      const voting = await this.mainRepository.findOneOrFail({ contractId })
      if (voting.status === MainStatus.mainKeySent) {
        this.loggerService.log(`Set voting status dkgCompleted to send MainKey again / round #${round} / ${contractId}`, 'MainService')
        await this.mainRepository.update({ contractId }, { status: MainStatus.dkgCompleted })
      }
      throw err
    }
  }

  private async sendZeroResults(voting: Main) {
    const state = this.contractStateService.getCachedState(voting.contractId)
    const result = voting.dimension.map((options) => Array(options).fill(0))
    voting.result = result
    this.loggerService.log(
      `[${(state && state.getTitle()) || 'unknown'}] Sending zero results for ${voting.contractId}`, 'MainService',
    )
    await this.contractApiService.result(voting)
    await this.mainRepository.update({ contractId: voting.contractId }, { result })
  }

  async subscribe(contractId: string) {
    await this.contractStateService.addToCache(contractId, SERVICE_CACHE_LABEL)
    const voting = await this.mainRepository.findOneOrFail({ contractId })
    this.votings.push(voting)
    this.loggerService.log(`Subscribed to ${contractId}`, 'MainService')
  }

  async unsubscribe(voting: Main, status: MainStatus.resultsReady | MainStatus.resultsFailed | MainStatus.pollHalted) {
    try {
      const state = await this.contractStateService.getActualState(voting.contractId)
      voting.status = status
      if (!state) {
        throw new Error(`Unsubscribe from unknown contract ${voting.contractId}`)
      }
      if (
        status === MainStatus.resultsFailed &&
        this.configService.isMainServer() &&
        ((voting.dateEnd && voting.dateEnd < new Date()) || !voting.dateEnd) &&
        !voting.result
      ) {
        try {
          await this.sendZeroResults(voting)
        } catch (err) {
          this.loggerService.error(
            `[${state.getTitle()}] Send zero results failed`,
            err,
            'MainService',
          )
        }
      }
      const idx = this.votings.findIndex(({ contractId }) => contractId === voting.contractId)
      this.votings.splice(idx, 1)
      await this.mainRepository.save(voting)
      this.loggerService.log(`[${state.getTitle()}] Unsubscribed from ${voting.contractId}`, 'MainService')
      this.contractStateService.removeFromCache(voting.contractId, SERVICE_CACHE_LABEL)
    } catch (err) {
      this.loggerService.error(err.message, err, 'MainService')
    }
  }

  getVoting(contractId: string): Main | undefined {
    return this.votings.find((voting) => voting.contractId === contractId)
  }

  getVotings(): Main[] {
    return this.votings
  }

  async finishVoting(pollId: string): Promise<void> {
    let voting: Main | undefined = this.votings.find((v) => v.pollId === pollId)
    if (!voting) {
      voting = await this.mainRepository.findOneOrFail({ pollId })
    }

    const contractState = await this.contractStateService.getActualState(voting.contractId)
    const round = contractState.getDkgRound()
    if (contractState.getStatus().toLowerCase() === 'completed') {
      throw new Error('Can not finalize already finished voting')
    }

    this.loggerService.log(`[${contractState.getTitle()}] Sending finishVoting / round #${round} / ${voting.contractId}`, 'MainService')
    try {
      await this.contractApiService.finishVoting(voting)
      await waitForUnlock(voting)
      const status = (new Date()) > voting.dateStart ? MainStatus.pollCompleted : MainStatus.pollHalted
      voting.status = status
      await this.mainRepository.update(voting.contractId, { status })
    } catch (err) {
      this.loggerService.error(`[${contractState.getTitle()}] Tx finishVoting failed for ${voting.contractId}:` + err.message || err, 'MainService')
    }
  }

  async addCommissionPubKey(pollId: string, commissionPubKey: PointObj): Promise<void> {
    const voting = await this.mainRepository.findOneOrFail({ pollId })
    if (voting.dateStart < new Date()) {
      throw new Error('Poll has started. CommissionPubKey rejected')
    }
    if (voting.commissionPubKey) {
      throw new Error('There is a key already. CommissionPubKey rejected')
    }

    let contractState: ContractState
    try {
      contractState = await this.contractStateService.getActualState(voting.contractId)
    } catch (err) {
      throw new Error('Smart-contract isn`t deployed yet. Send commissionPubKey later')
    }

    if (contractState.getStatus().toLowerCase() === 'halted') {
      throw new Error('Poll is halted. CommissionPubKey rejected')
    }

    const votingInMemory = this.votings.find((main) => main.pollId === pollId)
    if (votingInMemory) {
      votingInMemory.commissionPubKey = commissionPubKey
    }

    await this.mainRepository.update(voting.contractId, { commissionPubKey })
  }

  async addCommissionPrivKey(pollId: string, commissionPrivKey: string): Promise<void> {
    const voting = await this.mainRepository.findOneOrFail({ pollId })

    if (voting.status !== MainStatus.waitingCommissionKey) {
      throw new Error('Poll is not in waitingCommissionKey status')
    }

    let sums: Sums
    try {
      sums = await this.sumsRepository.findOneOrFail({
        where: { contractId: voting.contractId },
        order: { index: 'DESC' },
      })
    } catch (e) {
      throw new Error('No votes found')
    }

    if (sums.votes === 0) {
      throw new Error('No votes found')
    }

    const validPrivateKey = await this.cryptoService.validatePrivateKey(this.mapPointObj(voting.commissionPubKey), commissionPrivKey)
    if (!validPrivateKey) {
      throw new Error('CommissionPrivKey is not valid')
    }

    const contractState = await this.contractStateService.getActualState(voting.contractId)
    const round = contractState.getDkgRound()

    const questions = voting.dimension.length
    const commissionDecrypt: PartiallyDecrypted[][] = []
    for (let question = 0; question < questions; question++) {
      // tslint:disable-next-line:variable-name
      commissionDecrypt[question] = await this.cryptoService.partiallyDecryptSumA(sums!.A[question], commissionPrivKey)
    }
    this.loggerService.log(`[${contractState.getTitle()}] Sending commissionDecryption / round #${round} / ${voting.contractId}`, 'MainService')
    this.contractApiService.commissionDecryption(voting, commissionDecrypt)
      .then(async () => {
        await this.mainRepository.update(voting.contractId, { status: MainStatus.prepareResults })
        const votingInMemory = this.votings.find((v) => v.pollId === pollId)
        if (votingInMemory) {
          votingInMemory.status = MainStatus.prepareResults
        } else {
          return this.recount(pollId)
        }
      })
      .catch((err) =>
        this.loggerService.error(`[${contractState.getTitle()}] Tx commissionDecryption failed / round #${round} / ${voting.contractId}` + err.message || err, 'MainService'),
      )
  }

  async recount(pollId: string) {
    await this.jobsService.pauseJobs()
    const voting = await this.mainRepository.findOneOrFail({ pollId })
    await this.mainRepository.update({ contractId: voting.contractId }, {
      dateEnd: new Date(),
      errors: 0,
      status: MainStatus.pollActive,
    })
    await this.subscribe(voting.contractId)
    await this.jobsService.resumeJobs()
  }

  async getStatus(pollId: string) {
    try {
      const voting = await this.mainRepository.findOneOrFail({ pollId })

      let contractState
      try {
        contractState = await this.contractStateService.getActualState(voting.contractId)
      } catch (e) {
        this.loggerService.error(`Contract ${voting.contractId} not found`, '', 'MainService')
      }

      let votesUnique = 0
      let votesAll = 0
      let votesFail = 0
      let votesSuccess = 0
      try {
        const { height } = await this.crawlerService.getCurrentBlockInfo()
        const crawlerFailedNum = await this.crawlerService.getFailedBulletinsNum(voting.contractId, height)

        const sums = await this.sumsRepository.findOneOrFail({
          where: { contractId: voting.contractId },
          order: { index: 'DESC' },
        })
        votesUnique = sums.voted
        votesAll = sums.votes
        votesFail = +sums.invalid + +crawlerFailedNum
        votesSuccess = sums.votes - sums.invalid
        // tslint:disable-next-line:no-empty
      } catch (e) {}

      const dateStart = contractState ? contractState.getDateStart() : voting.dateStart
      const dateEnd = contractState ? contractState.getDateEnd() : voting.dateEnd

      let k = 0
      let round = 1
      let mainKey: Point = ['0', '0']
      const { blindSigModulo, blindSigExponent } = voting
      let bulletinHash = ''
      let decryptionStatus: ServerPublicStatus[] = []
      try {
        if (contractState) {
          k = contractState.getK()
          round = contractState.getDkgRound()
          mainKey = contractState.getMainKey()
          bulletinHash = contractState.getBulletinHash()
          decryptionStatus = contractState.getPublicDecryptionStatus()
        }
        // tslint:disable-next-line:no-empty
      } catch (e) {}

      return {
        status: voting.status,
        decryptionStatus,
        type: voting.type,
        bulletinHash,
        dimension: voting.dimension,
        dateStart: new Date(dateStart).getTime(),
        dateEnd: dateEnd ? new Date(dateEnd).getTime() : undefined,
        blindSigModulo,
        blindSigExponent,
        minDecryptAmount: k,
        totalDecryptAmount: this.configService.getDecryptPublicKeys().length,
        dkgRound: round,
        mainKey,
        votesUnique,
        votesAll,
        votesFail,
        votesSuccess,
        results: voting.result ? voting.result : undefined,
        txId: voting.contractId,
      }
    } catch (e) {
      throw new NotFoundException()
    }
  }

  private mapPointObj(point: PointObj): Point {
    return [point.x, point.y]
  }

  private mapPointToObj(point: Point): PointObj {
    return {
      x: (new BN(point[0])).toString('hex'),
      y: (new BN(point[1])).toString('hex'),
    }
  }
}
