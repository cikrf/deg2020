import { Inject, Injectable } from '@nestjs/common'
import * as readline from 'readline'
import { DecryptService } from './decrypt.service'
import { NodeService } from './node.service'
import { CrawlerService } from '../../crawler/crawler.service'
import { ConfigService } from '../../config/config.service'
import { MAIN_REPOSITORY_TOKEN, SUMS_REPOSITORY_TOKEN } from '../../common/constants'
import { Repository } from 'typeorm'
import { ContractApiService } from './contract.api.service'
import { LoggerService } from '../../logger/logger.service'
import { DecryptionStatus } from '../../entities/decryption.entity'
import { MainService } from './main.service'
import { Main, MainStatus } from '../../entities/main.entity'
import { JobsService } from '../../jobs/jobs.service'
import { DecryptionDB } from '../../database/models/decryptions/decryptions.service'
import { Sums } from '../../entities/sums.entity'
import { MoreThan } from 'typeorm/index'

enum Command {
  resume = 'resume',
  jobsStatus = 'jobsStatus',
  pause = 'pause',
  list = 'list',
  stat = 'stat',
  getVotingState = 'getVotingState',
  getContractState = 'getContractState',
  getResults = 'getResults',
  getDbState = 'getDbState',
  setStatus = 'setStatus',
  setAllStatusFinished = 'setAllStatusFinished',
  setLogLevel = 'setLogLevel',
  startNewRound = 'startNewRound',
  finishVoting = 'finishVoting',
  getTxStatus = 'getTxStatus',
  sendDkgComplaint = 'sendDkgComplaint',
  recount = 'recount',
  recountMain = 'recountMain',
  resetErrorsCounter = 'resetErrorsCounter',
  quit = 'quit',
}

const description = {
  [Command.resume]: 'resume',
  [Command.jobsStatus]: 'jobStatus',
  [Command.pause]: 'pause',
  [Command.list]: 'list',
  [Command.stat]: 'stat',
  [Command.getVotingState]: 'getVotingState <contractId>',
  [Command.getContractState]: 'getContractState <contractId>',
  [Command.getResults]: 'getResults <contractId>',
  [Command.getDbState]: 'getDbState <contractId>',
  [Command.setStatus]: 'setStatus <contractId> <status>',
  [Command.getTxStatus]: 'getTxStatus <txId>',
  [Command.sendDkgComplaint]: 'sendDkgComplaint <contractId> <publicKey> <round>',
  [Command.setAllStatusFinished]: 'setAllStatusFinished',
  [Command.setLogLevel]: 'setLogLevel <level> <true|false>',
  [Command.startNewRound]: 'startNewRound <contractId>',
  [Command.finishVoting]: 'finishVoting <contractId>',
  [Command.recount]: 'recount <contractId>',
  [Command.recountMain]: 'recountMain <contractId>',
  [Command.resetErrorsCounter]: 'resetErrorsCounter <contractId>',
  // [Command.quit]: 'quit',
}

@Injectable()
export class CmdService {
  private rl: readline.Interface

  constructor(
    private readonly decryptService: DecryptService,
    private readonly mainService: MainService,
    private readonly nodeService: NodeService,
    private readonly crawlerService: CrawlerService,
    private readonly configService: ConfigService,
    private readonly contractApiService: ContractApiService,
    private readonly loggerService: LoggerService,
    private readonly jobsService: JobsService,
    private readonly decryptionDB: DecryptionDB,
    @Inject(SUMS_REPOSITORY_TOKEN) private readonly sumsRepository: Repository<Sums>,
    @Inject(MAIN_REPOSITORY_TOKEN) private readonly mainRepository: Repository<Main>,
  ) {
    if (!this.configService.isDev()) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `\n> `,
        completer: (line: string) => {
          const commands = Object.keys(description)
          const hits = commands.filter((c) => c.startsWith(line))
          return [hits.length ? hits : commands, line]
        },
      })
      this.bindCommands()
    }
  }

  private bindCommands() {
    this.rl.on('line', async (line: string) => {
      try {
        const args: string[] = line
          .trim()
          .replace(/ +/g, ' ')
          .split(' ')
          .map((s) => s.trim())

        switch (args[0]) {
          default:
            console.log(`\nAvailable commands:\n${Object.values(description).join(`\n`)}`)
            break

          case Command.stat:
            const counter: { [key: string]: number } = {}
            const statVotings = this.decryptService.getVotings()
            if (statVotings.length === 0) {
              console.log({})
            }
            statVotings.map((v) => {
              if (!counter[v.status]) {
                counter[v.status] = 0
              }
              counter[v.status]++
            })
            const keys = Object.keys(counter)
            console.log(keys.map((key) => `${key}: ${counter[key]}`).join(' / '))
            break

          case Command.list:
            const votings = this.decryptService
              .getVotings()
              .filter((v) => (args[1] ? v.status === args[1] : true))
            console.log(votings)
            break

          case Command.getVotingState:
            const votingState = await this.decryptService.getVoting(args[1])
            console.log(votingState)
            break

          case Command.getContractState:
            const state = await this.nodeService.getContractState(args[1])
            console.log(state)
            break

          case Command.recount:
            this.rl.question('Are you sure? Y/N ', async (answer: string) => {
              await this.jobsService.pauseJobs()
              if (answer === 'Y') {
                const recountDecryption = await this.decryptionDB.findOneOrFail(args[1])
                await this.sumsRepository.delete({
                  contractId: recountDecryption.contractId,
                  height: MoreThan(0),
                })
                recountDecryption.recounting = true
                recountDecryption.status = DecryptionStatus.running
                await this.decryptService.subscribe(recountDecryption)
                console.log('Done')
              } else {
                console.log('Cancelled')
              }
              await this.jobsService.resumeJobs()
            })
            break

          case Command.recountMain:
            this.rl.question('Are you sure? Y/N ', async (answer: string) => {
              await this.jobsService.pauseJobs()
              if (answer === 'Y') {
                await this.mainRepository.findOneOrFail(args[1])
                await this.mainRepository.update({ contractId }, { status: MainStatus.pollActive, errors: 0 })
                await this.mainService.subscribe(args[1])
                console.log('Done')
              } else {
                console.log('Cancelled')
              }
              await this.jobsService.resumeJobs()
            })
            break

          case Command.resetErrorsCounter:
            const decryptionToReset = this.decryptService.getVoting(args[1])
            if (decryptionToReset) {
              decryptionToReset.errors = 0
              await this.decryptionDB.save(decryptionToReset)
              console.log('Decryption voting - done')
            }
            const mainToReset = this.mainService.getVoting(args[1])
            if (mainToReset) {
              mainToReset.errors = 0
              await this.mainRepository.save(mainToReset)
              console.log('Main voting - done')
            }
            break

          case Command.getResults:
            const votingResult = await this.nodeService.getResults(args[1])
            console.log(votingResult)
            break

          case Command.getDbState:
            const dbState = await this.decryptionDB.findOneOrFail(args[1])
            console.log(dbState)
            break

          case Command.setStatus:
            const result = this.decryptService.setVotingStatus(args[1], args[2] as DecryptionStatus)
            console.log(result)
            break

          case Command.setAllStatusFinished:
            await this.jobsService.pauseJobs()
            this.rl.question('Are you sure? Y/N ', async (answer: string) => {
              if (answer === 'Y') {
                const { affected } = await this.decryptionDB.finishAllVotes()
                console.log('Done', affected)
              } else {
                console.log('Cancelled')
              }
              await this.jobsService.resumeJobs()
            })
            break

          case Command.getTxStatus:
            const txStatus = await this.nodeService.getTransactionStatus(args[1])
            console.log(txStatus)
            break

          case Command.sendDkgComplaint:
            const contractId = args[1]
            const publicKey = args[2]
            const round: number = +args[3]
            const txId = await this.crawlerService.getWrongShadowTxId(contractId, publicKey, round)
            const voting = this.decryptService.getVoting(contractId)
            if (voting && txId) {
              await this.contractApiService.dkgComplaint(voting, txId)
            } else {
              console.log('Wrong params')
            }
            break

          case Command.setLogLevel:
            const level = args[1]
            const value = args[2] === 'true'
            this.loggerService.setLogLevel(level, value)
            break

          case Command.startNewRound:
            const votingToStartNewRound = this.mainService.getVoting(args[1])
            if (votingToStartNewRound) {
              await this.mainService.startNewRound(votingToStartNewRound)
            }
            break

          case Command.finishVoting:
            const finishVoting = await this.mainRepository.findOneOrFail(args[1])
            await this.contractApiService.finishVoting(finishVoting)
            break

          case Command.jobsStatus:
            console.log(await this.jobsService.jobsStatus())
            break

          case Command.resume:
            await this.jobsService.resumeJobs()
            break

          case Command.pause:
            await this.jobsService.pauseJobs()
            break

          case Command.quit:
            process.exit(0)
            break
        }
      } catch (error) {
        console.error(error.message)
      }
      this.rl.prompt()
    })
  }
}
