import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { CronExpression } from '@nestjs/schedule'
import { Repository } from 'typeorm'
import { MAX_VOTING_ERRORS, QUEUE_THREAD_DELAY, QUEUE_THREADS, SUMS_REPOSITORY_TOKEN } from '../../common/constants'
import { CrawlerService } from '../../crawler/crawler.service'
import {
  DECRYPT_ACTIONS_AFTER_END_STATUSES,
  Decryption,
  DecryptionStatus,
  DKG_FINAL_STATUSES,
  DKG_PROCESS_STATUSES,
} from '../../entities/decryption.entity'
import { LoggerService } from '../../logger/logger.service'
import { ContractApiService } from './contract.api.service'
import { ConfigService } from '../../config/config.service'
import { QueueManager } from './queue.manager'
import { CryptoService } from '../../crypto/crypto.service'
import { NodeService } from './node.service'
import { ContractStateService } from './contract.state.service'
import { sleep } from '../../common/sleep'
import { Sums } from '../../entities/sums.entity'
import { MainType } from '../../entities/main.entity'
import { chunk } from 'lodash'
import { JobsService } from '../../jobs/jobs.service'
import { DecryptionDB } from '../../database/models/decryptions/decryptions.service'
import pFilter from 'p-filter'
import { waitForUnlock } from '../../common/waitForUnlock'

const SERVICE_CACHE_LABEL = 'decrypt'

@Injectable()
export class DecryptService implements OnApplicationBootstrap {
  private contractIds: Set<string>
  private votings: Decryption[] = []
  private decryptionQueue: QueueManager<Decryption>
  private countVotesQueue: QueueManager<Decryption>
  private height: number = 0

  constructor(
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly loggerService: LoggerService,
    private readonly crawlerService: CrawlerService,
    private readonly contractApiService: ContractApiService,
    private readonly contractStateService: ContractStateService,
    private readonly jobsService: JobsService,
    private readonly nodeService: NodeService,
    private readonly decryptionDB: DecryptionDB,
    @Inject(SUMS_REPOSITORY_TOKEN) private readonly sumsRepository: Repository<Sums>,
  ) {}

  private async createEmptySums(contractId: string, dimension: number[]): Promise<Sums> {
    const sums = await this.sumsRepository.create({
      contractId,
      votes: 0,
      voted: 0,
      A: dimension.map((optionsNum: number) => Array(optionsNum).fill([0, 1])),
      B: dimension.map((optionsNum: number) => Array(optionsNum).fill([0, 1])),
    })
    return this.sumsRepository.save(sums)
  }

  async onApplicationBootstrap() {
    if (!this.configService.isDecryptServer()) {
      return
    }

    this.votings = await this.decryptionDB.findNotFinishedVotings()

    await Promise.all(
      this.votings.map(async ({ contractId }, i) => {
        await sleep(i * QUEUE_THREAD_DELAY)
        await this.contractStateService.addToCache(contractId, SERVICE_CACHE_LABEL)
      }),
    )
    this.contractIds = new Set(this.votings.map(({ contractId }) => contractId))

    this.jobsService.addJob('cleanupDecryptionVotings', this.cleanupVotings.bind(this))
    this.jobsService.addJob('roundWatcher', this.checkNewRounds.bind(this))
    this.jobsService.addJob('crawlerVotingsWatcher', this.crawlerVotingsWatcher.bind(this))
    this.jobsService.addJob('crawlerDateEndWatcher', this.crawlerDateEndDecryptionWatcher.bind(this), { cronTime: CronExpression.EVERY_10_SECONDS })

    this.decryptionQueue = new QueueManager<Decryption>(this.votings, this.decryptQueueUpdater.bind(this))
    this.jobsService.addJob('decryptActionsRunner', this.decryptActionsRunner.bind(this), { concurrent: true })

    this.countVotesQueue = new QueueManager<Decryption>(this.votings, this.countVotesQueueUpdater.bind(this))
    this.jobsService.addJob('votesWatcher', this.votesWatcher.bind(this), { concurrent: true })

    this.jobsService.setDecrypt(this)
  }

  async subscribe(decryption: Decryption) {
    const { contractId } = decryption
    this.contractIds.add(contractId)
    await this.contractStateService.addToCache(contractId, SERVICE_CACHE_LABEL)
    this.votings.push(decryption)
    this.loggerService.log(`Subscribed to ${contractId}`, 'DecryptService')
  }

  async unsubscribe(voting: Decryption) {
    const state = this.contractStateService.getCachedState(voting.contractId)
    voting.status = DecryptionStatus.finished
    const idx = this.votings.findIndex(({ contractId }) => contractId === voting.contractId)
    this.votings.splice(idx, 1)
    this.loggerService.log(`[${state && state.getTitle()}] Unsubscribed from ${voting.contractId}`, 'DecryptService')
    await this.decryptionDB.save(voting)
    this.contractStateService.removeFromCache(voting.contractId, SERVICE_CACHE_LABEL)
  }

  private async cleanupVotings() {
    // unsubscribe from dead votings
    await Promise.all(
      this.votings
        .filter((voting) => !voting.recounting)
        .filter((voting) =>
          voting.dateEnd && voting.dateEnd < new Date(Date.now() - this.configService.getDeadVotingTimeout()) ||
          voting.errors > MAX_VOTING_ERRORS,
        )
        .map(this.unsubscribe.bind(this)),
    )

    // unlock frozen votings
    this.votings
      .filter(({ status, lock, lockDate }) => status !== DecryptionStatus.running && lock && lockDate < new Date(Date.now() - this.configService.getTxSuccessTimeout() * 2))
      .map((voting) => {
        const contractId = voting.contractId
        const contractState = this.contractStateService.getCachedState(contractId)
        this.loggerService.debug(
          `[${contractState && contractState.getTitle()}] Unlocking ${contractId}`, 'DecryptService',
        )
        voting.lock = false
        voting.status = DecryptionStatus.error
      })
  }

  private countVotesQueueUpdater() {
    return this.votings
      .filter(({ dateStart }) => dateStart < new Date())
      .filter((voting) => !voting.lock && !voting.counted)
  }

  private decryptQueueUpdater() {
    let queue: Decryption[] = this.votings

    // filter votings which need decrypt actions
    queue = queue
      .filter((voting) => !(voting.status === DecryptionStatus.finished || !voting.status))
      .filter((voting) => !(voting.status === DecryptionStatus.running && !voting.counted && voting.dateStart < new Date()))
      .filter((voting) => !(DecryptionStatus.error === voting.status && voting.lockDate > new Date(Date.now() - this.configService.getVotingHoldTimeout())))
      .filter((voting) => !(DKG_FINAL_STATUSES.includes(voting.status) && voting.dateStart > new Date()))

    this.loggerService.verbose(`In queue: [ ${queue.map(({ contractId }) => contractId).join(', ')} ]`, 'QueueManager')

    queue = queue.filter((voting) => !voting.lock)

    this.loggerService.verbose(`Not locked: [ ${queue.map(({ contractId }) => contractId).join(', ')} ]`, 'QueueManager')
    return queue
  }

  crawlerDateEndDecryptionWatcher() {
    this.votings
      .filter((voting) => !voting.dateEnd)
      .map(async (voting) => {
        const dateEnd = await this.crawlerService.getVotingDateEnd(voting.contractId)
        this.loggerService.verbose(`check ${voting.contractId} dateEnd ${dateEnd}`, 'DecryptService')
        if (dateEnd) {
          voting.dateEnd = dateEnd
          await this.decryptionDB.updateDateEnd(voting.contractId, dateEnd)
        }
      })
  }

  async crawlerVotingsWatcher() {
    try {
      const { height } = await this.crawlerService.getCurrentBlockInfo()

      if (this.height === height) {
        return
      }

      const inBC: string[] = await this.crawlerService.getVotings(this.height)
      let inDB: string[]
      let newIds: string[]

      if (!this.height) {
        inDB = await this.decryptionDB.getAllContractIds()
        this.loggerService.debug(
          `Cold start! Actual in DB: ${inDB.length}. Actual in blockchain: ${inBC.length}`, 'DecryptService',
        )
        newIds = inBC.filter((contractId) => !inDB.includes(contractId))
      } else {
        newIds = inBC.filter((contractId) => !this.contractIds.has(contractId))
      }

      if (newIds.length) {
        this.loggerService.debug(`Found ${newIds.length} new votings. Height: ${height}`, 'DecryptService')
      }

      await Promise.all(
        newIds.map(async (contractId, i) => {
          const votingInfo = await this.nodeService.getVotingBase(contractId)
          if (votingInfo) {
            const keys = await this.cryptoService.generateKeys()
            const decryption = await this.decryptionDB.createInstance({
              status: DecryptionStatus.round,
              ...votingInfo,
              ...keys,
              contractId,
              round: 1,
            })
            await this.decryptionDB.save(decryption)
            await this.subscribe(decryption)
          }
        }),
      )

      this.height = height
    } catch (e) {
      console.log(e)
      this.loggerService.error('Can not get new votings from crawler', '', 'DecryptService')
    }
  }

  async checkNewRounds() {
    const votingsToCheck = this.votings.filter((voting) =>
      [...DKG_FINAL_STATUSES, ...DKG_PROCESS_STATUSES].includes(voting.status),
    )
    const lastRounds = await this.crawlerService.getLastRoundFor(votingsToCheck.map(({ contractId }) => contractId))
    votingsToCheck.map(async (voting) => {
      const last = lastRounds.find((row) => row.contractId === voting.contractId)

      await waitForUnlock(voting)
      if (last && last.round > voting.round) {
        await this.startNewRound(voting)
      }
    })
  }

  private async startNewRound(voting: Decryption) {
    voting.lock = true
    const { contractId } = voting
    const contractState = await this.contractStateService.getActualState(contractId)
    const round = contractState.getDkgRound()
    let status: DecryptionStatus
    if (!contractState.isServerActive()) {
      this.loggerService.log(
        `[${contractState.getTitle()}] Blocked for round #${round} / ${contractId}`, 'DecryptService',
      )
      status = DecryptionStatus.disabled
      await this.decryptionDB.updateRound(contractId, status, round)
    } else {
      this.loggerService.log(`[${contractState.getTitle()}] Starting round #${round} / ${contractId}`, 'DecryptService')
      status = DecryptionStatus.round
      const keys = await this.cryptoService.generateKeys()
      await this.decryptionDB.updateRoundWithKeys(voting.contractId, status, round, keys)
    }
    voting.status = status
    voting.round = round
    voting.lock = false

  }

  async votesWatcher() {
    const { time_stamp, height } = await this.crawlerService.getCurrentBlockInfo()
    this.countVotesQueue.get().map(async (voting: Decryption, i) => {
      voting.lock = true
      voting.lockDate = new Date()

      await sleep(i * QUEUE_THREAD_DELAY)

      const { contractId, dimension, mainKey } = voting
      const limit = this.configService.getBulletinChunkSize()

      let prevSums
      try {
        prevSums = await this.sumsRepository.findOneOrFail({
          where: { contractId },
          order: { index: 'DESC' },
        })
      } catch (e) {
        prevSums = await this.createEmptySums(contractId, dimension)
      }

      const offset = prevSums.votes
      let votes = await this.crawlerService.getVotes(contractId, height, limit, offset)
      const processed = votes.length ? +votes[0].processed : 0

      const contractState = await this.contractStateService.getCachedState(contractId)
      const votingTitle = contractState!.getTitle()

      // blind signature verify
      if (this.configService.getBlindSignatureVerify()) {
        const exponent = contractState!.getBlindSigExponent()
        const modulo = contractState!.getBlindSigModulo()
        if (!exponent || !modulo) {
          this.loggerService.warn(`[${votingTitle}] Voting ${contractId}. No exponent or modulo in state`, 'VotesWatcher')
        } else {
          if (votes.length > 0 && this.configService.getContractType() === MainType.blind) {
            const verifiedBlindSignatures = []
            const chunks = chunk(votes, this.configService.getBlindSignatureChunkSize())

            for (const blindSignaturesChunk of chunks) {
              const verified = await pFilter(blindSignaturesChunk, async (vote: any) => {
                if (vote.blindSig) {
                  const { blindSig, sender_public_key } = vote
                  try {
                    return await this.cryptoService.blindSignatureVerifyRSA(blindSig, sender_public_key, modulo, exponent)
                  } catch (e) {
                    this.loggerService.error(`[${votingTitle}] Voting ${contractId}. Blind signature failed for tx ${vote.id}`, '', 'VotesWatcher')
                    return false
                  }
                } else {
                  this.loggerService.error(`[${votingTitle}] Voting ${contractId}. No blind signature for tx ${vote.id}`, '', 'VotesWatcher')
                }
                return false
              })
              // tslint:disable-next-line:max-line-length
              this.loggerService.warn(`[${votingTitle}] Voting ${contractId}. Blind signature correct for ${verified.length} of ${blindSignaturesChunk.length} bulletins`, 'VotesWatcher')
              verifiedBlindSignatures.push(...verified)
            }
            votes = verifiedBlindSignatures
          }
        }
      }

      // verify bulletins
      if (mainKey && votes.length) {
        try {
          const flatted = votes.flatMap((bulletin) => bulletin.vote.map((question) => ({ id: bulletin.id, question })))
          const verified = await this.cryptoService.verifyEncryptedBulletins(flatted.map(el => el.question), mainKey)
          const invalid = flatted.filter((_, idx) => !verified[idx]).map(({ id }) => id)
          invalid.map((txId) => this.loggerService.warn(`[${votingTitle}] Voting ${contractId}. Verification failed. Tx Id: ${txId}`, 'VotesWatcher'))
          const invalidIds = [...new Set(invalid)]
          votes = votes.filter((vote) => !invalidIds.includes(vote.id))
          const votesToAdd = votes.filter((vote) => vote.mul > 0)
          const votesToSubtract = votes.filter((vote) => vote.mul < 0)

          const newSums = await this.sumsRepository.create({ ...prevSums, height, index: undefined })
          this.loggerService.verbose({ contractId, height, limit, offset }, 'VotesWatcher')
          for (let question = 0; question < voting.dimension.length; question++) {
            let sums = { sum_A: prevSums!.A[question], sum_B: prevSums!.B[question] }
            sums = await this.cryptoService.addEncryptedBulletins(votesToAdd.map((vote) => vote.vote[question]), mainKey, sums)
            sums = await this.cryptoService.subtractEncryptedBulletins(votesToSubtract.map((vote) => vote.vote[question]), mainKey, sums)
            newSums.A[question] = sums.sum_A
            newSums.B[question] = sums.sum_B
          }
          newSums.invalid += invalidIds.length
          newSums.voted += votesToAdd.length - votesToSubtract.length
          this.loggerService.log(`[${votingTitle}] Voting ${contractId}. Total: ${newSums.voted} Added: ${votesToAdd.length}. Subtracted: ${votesToSubtract.length}. Invalid: ${newSums.invalid}`, 'VotesWatcher')
          newSums.votes += processed
          newSums.height = votes.reduce((acc, vote) => (vote.height > acc ? vote.height : acc), 0)
          await this.sumsRepository.save(newSums)
        } catch (error) {
          this.loggerService.error(`[${votingTitle}] Voting ${contractId}. ${error.message}`, '', 'VotesWatcher')
          voting.status = DecryptionStatus.error
          voting.errors++
        }
      }

      voting.lock = false
      if (voting.dateEnd && time_stamp >= voting.dateEnd && processed === 0) {
        voting.counted = true
      }
    })
  }

  decryptActionsRunner() {
    this.decryptionQueue.get(QUEUE_THREADS).map(async (voting, i) => {
      try {
        voting.lock = true
        voting.lockDate = new Date()

        await sleep(i * QUEUE_THREAD_DELAY)

        const contractId = voting.contractId
        const votingIdx = this.votings.findIndex((v) => v.contractId === voting.contractId)

        if (votingIdx === -1) {
          // stop if voting was unsubed
          return
        }

        const contractState = await this.contractStateService.getActualState(contractId)

        if (voting.dateStart > new Date()) {
          if (voting.status === DecryptionStatus.error) {
            voting.status = contractState.recoverStatus()
            if (voting.status === 'round') {
              voting.round = contractState.getDkgRound()
            }
            this.loggerService.log(
              `[${contractState.getTitle()}] Recovered status: ${voting.status} / ${contractId}`, 'DecryptService',
            )
          } else if (voting.status === DecryptionStatus.round) {
            this.loggerService.log(
              `[${contractState.getTitle()}] Sending dkgCommit / round #${voting.round} / ${contractId}`,
              'DecryptService',
            )
            await this.contractApiService.dkgCommit(voting)
            voting.status = DecryptionStatus.dkgCommit
          } else if (
            voting.status === DecryptionStatus.dkgCommit &&
            contractState.isAllCommitsPublished()
          ) {
            this.loggerService.log(
              `[${contractState.getTitle()}] Sending dkgScalar / round #${voting.round} / ${contractId}`,
              'DecryptService',
            )
            await this.contractApiService.dkgScalar(voting)
            voting.status = DecryptionStatus.dkgScalar
          } else if (
            voting.status === DecryptionStatus.dkgScalar &&
            contractState.isAllScalarsPublished()
          ) {
            this.loggerService.log(
              `[${contractState.getTitle()}] Sending dkgShadows / round #${voting.round} / ${contractId}`,
              'DecryptService',
            )

            const publicKeysCommits = contractState.getDkgCommits()
            const secretKeysOfCommits = contractState.getDkgScalars()
            const unblindedPublicKeys = await this.cryptoService.unblindPublicKeys(
              publicKeysCommits,
              secretKeysOfCommits,
            )
            const polynomialCoefficients = await this.cryptoService.generatePolynomialCoefficients(
              voting.privateKey,
              contractState.getK(),
            )
            const exponents = await this.cryptoService.calculatePolynomialCoefficientsExponents(
              polynomialCoefficients,
            )
            const shadows = await this.cryptoService.calculateEncryptedShadows(
              polynomialCoefficients,
              unblindedPublicKeys,
            )

            await this.contractApiService.dkgShadows(voting, exponents, shadows)
            voting.status = DecryptionStatus.dkgShadows
          } else if (
            voting.status === DecryptionStatus.dkgShadows &&
            contractState.isAllShadowsPublished()
          ) {
            this.loggerService.log(
              `[${contractState.getTitle()}] Checking shadows / round #${voting.round} ` +
              `/ ${contractId}`, 'DecryptService',
            )

            const publicKeysCommits = contractState.getDkgCommits()
            const secretKeysOfCommits = contractState.getDkgScalars()
            const unblindedPublicKeys = await this.cryptoService.unblindPublicKeys(
              publicKeysCommits,
              secretKeysOfCommits,
            )
            const idx = contractState.getOwnIndex()
            const shadows = contractState.getDkgShadows()
            const exponents = contractState.getDkgExponents()

            const response = await this.cryptoService.decryptAndCheckShadows(
              voting.privateKey,
              idx,
              shadows,
              exponents,
              unblindedPublicKeys,
            )
            if (response.status === 'ok') {
              voting.decryptedShadowsSum = response.sum
              voting.status = DecryptionStatus.verified
              this.loggerService.log(
                `[${contractState.getTitle()}] Shadows OK / round #${voting.round} / ${contractId}`, 'DecryptService',
              )
            } else if (isFinite(response.idx)) {
              console.log(`\n\n\n\n\n\n---------\n\n\n\n\n\n\n${JSON.stringify(response)}\n\n\n\n\n\n-------`)
              const publicKey = contractState.getPublicKeyOfServer(response.idx)
              if (publicKey) {
                let txId: string = await this.crawlerService.getWrongShadowTxId(
                  voting.contractId,
                  publicKey,
                  voting.round,
                )
                while (!txId) {
                  this.loggerService.log(
                    `[${contractState.getTitle()}] Waiting for blockchain ${contractId}`, 'DecryptService',
                  )
                  await sleep(this.configService.getVotingHoldTimeout())
                  txId = await this.crawlerService.getWrongShadowTxId(
                    voting.contractId,
                    publicKey,
                    voting.round,
                  )
                }
                this.loggerService.log(
                  `[${contractState.getTitle()}] Sending complaint on ${response.idx} / ` +
                  `round #${voting.round} / ${contractId}`, 'DecryptService',
                )
                await this.contractApiService.dkgComplaint(voting, txId)
                voting.status = DecryptionStatus.dkgComplaint
              } else {
                this.loggerService.log(
                  `[${contractState.getTitle()}] Server ${response.idx} not found for complaint` +
                  `/ round #${voting.round} / ${contractId}`, 'DecryptService',
                )
                voting.status = DecryptionStatus.error
              }
            } else {
              this.loggerService.error(
                `${response.message} / round #${voting.round} / ${contractId}`, '', 'DecryptService',
              )
              voting.status = DecryptionStatus.error
            }
          }
        } else if (voting.dateEnd && voting.dateEnd < new Date() && voting.counted) {
          if (DECRYPT_ACTIONS_AFTER_END_STATUSES.includes(voting.status)) {
            voting.status = DecryptionStatus.decrypted

            const sums = await this.sumsRepository.findOneOrFail({
              where: { contractId },
              order: { index: 'DESC' },
            })
            if (!sums || sums.votes === 0) {
              this.loggerService.log(`[${contractState.getTitle()}] No votes found for ${contractId}`, 'DecryptService')
              await this.unsubscribe(voting)
              return
            } else if (!voting.decryptedShadowsSum) {
              this.loggerService.log(
                `[${contractState.getTitle()}] Not all shadows published, decryption is impossible` +
                ` / round #${voting.round} / ${contractId}`, 'DecryptService',
              )
              await this.unsubscribe(voting)
              return
            } else {
              this.loggerService.log(`[${contractState.getTitle()}] Partial decrypting ${contractId}`, 'DecryptService')
              const decryption = []
              for (let question = 0; question < voting.dimension.length; question++) {
                decryption[question] = await this.cryptoService.partiallyDecryptSumA(
                  sums.A[question],
                  voting.decryptedShadowsSum,
                )
              }
              await this.contractApiService.decryption(voting, decryption)
              this.loggerService.log(
                `[${contractState.getTitle()}] Decryption finished ${contractId}. ` +
                `Total: ${sums.votes}. Unique votes ${sums.voted}`, 'DecryptService',
              )
              voting.status = DecryptionStatus.decrypted
              voting.recounting = false
            }
          } else if (voting.status === DecryptionStatus.decrypted) {
            if (contractState.isDecryptionDelivered()) {
              await this.unsubscribe(voting)
              return
            } else {
              this.loggerService.warn(
                `Decryption is not delivered / round #${voting.round} / ${contractId}`, 'DecryptService',
              )
              voting.status = DecryptionStatus.error
            }
          }
        } else {
          const mainKey = contractState.getMainKey()

          if (!mainKey) {
            this.loggerService.log(
              `[${contractState.getTitle()}] No main key for ${contractId}`, 'DecryptService',
            )
            await this.unsubscribe(voting)
            return
          } else if (!contractState.isServerActive()) {
            this.loggerService.log(
              `[${contractState.getTitle()}] Server blocked ${contractId}`, 'DecryptService',
            )
            await this.unsubscribe(voting)
            return
          } else if (voting.status !== DecryptionStatus.running) {
            this.loggerService.log(
              `[${contractState.getTitle()}] Voting ${contractId} started`, 'DecryptService',
            )
            voting.mainKey = mainKey
            voting.status = DecryptionStatus.running
          }
        }
      } catch (error) {
        this.loggerService.error(
          `${error.message} / round #${voting.round} / ${voting.contractId}`, '', 'DecryptService',
        )
        voting.status = DecryptionStatus.error
        voting.errors++
      }
      await this.decryptionDB.save(voting)
      voting.lock = false
    })
  }

  getVoting(contractId: string): Decryption | undefined {
    return this.votings.find((voting) => voting.contractId === contractId)
  }

  getVotings(): Decryption[] {
    return this.votings
  }

  setVotingStatus(contractId: string, status: DecryptionStatus): string {
    const voting = this.votings.find((v) => v.contractId === contractId)
    if (!voting) {
      return 'Voting not found'
    }
    if (!DecryptionStatus[status]) {
      return 'Wrong status'
    }
    voting.status = DecryptionStatus[status]
    return 'Done'
  }
}
