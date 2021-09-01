import { Injectable } from '@nestjs/common'
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule'
import { LoggerService } from '../logger/logger.service'
import { sleep } from '../common/sleep'
import { CronJob } from 'cron'
import { MainService } from '../voting/services/main.service'
import { DecryptService } from '../voting/services/decrypt.service'

type Options = {
  cronTime?: string,
  concurrent?: boolean,
  start?: boolean
}

@Injectable()
export class JobsService {
  private mainService: MainService
  private decryptService: DecryptService
  private readonly lock: Map<string, boolean> = new Map()

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly loggerService: LoggerService,
  ) {}

  setMain(main: MainService) {
    this.mainService = main
  }

  setDecrypt(decrypt: DecryptService) {
    this.decryptService = decrypt
  }

  addJob(name: string, func: () => void, options: Options = {}) {
    const { cronTime, start, concurrent } = {
      cronTime: CronExpression.EVERY_SECOND,
      start: false,
      concurrent: false,
      ...options,
    }

    const wrapped = concurrent
      ? func
      : (async () => {
        if (!this.lock.get(name)) {
          this.lock.set(name, true)
          await func()
          this.lock.set(name, false)
        }
      })

    const job = new CronJob(cronTime, wrapped.bind(this), null, start)
    this.schedulerRegistry.addCronJob(name, job)
  }

  hasLocked() {
    const hasLockedDecryptions = this.decryptService ? this.decryptService.getVotings().some((voting) => voting.lock) : false
    const hasLockedMain = this.mainService ? this.mainService.getVotings().some((voting) => voting.lock) : false
    return hasLockedDecryptions || hasLockedMain
  }

  jobsStatus() {
    return [...this.schedulerRegistry.getCronJobs()].map(([name, cronJob]) => ({
      name,
      running: cronJob.running,
    }))
  }

  resumeJobs() {
    const jobs = this.schedulerRegistry.getCronJobs()
    jobs.forEach((job) => job.start())
    this.loggerService.log(`Jobs resumed`, 'JobsService')
  }

  async pauseJobs(exclude?: string[]) {
    [...this.schedulerRegistry.getCronJobs()].map(([name, cronJob]) => {
      if (exclude && exclude.includes(name)) {
        return
      }
      cronJob.stop()
    })

    while (this.hasLocked()) {
      this.loggerService.warn(`Has locked votings. Waiting until finished...`, 'JobsService')
      await sleep(5000)
    }
    this.loggerService.log(`Jobs paused`, 'JobsService')
  }
}
