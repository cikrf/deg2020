import { Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerModule } from '../logger/logger.module'
import { ScheduleModule } from '@nestjs/schedule'
import { VotingModule } from '../voting/voting.module'
import { BalanceModule } from '../balance/balance.module'
import { JobsModule } from '../jobs/jobs.module'
import { CrawlerModule } from '../crawler/crawler.module'

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    BalanceModule,
    CrawlerModule,
    JobsModule,
    ScheduleModule.forRoot(),
    VotingModule.register(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class ApplicationModule {}
