import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { ConfigModule } from '../config/config.module'
import { CrawlerService } from './crawler.service'
import { LoggerModule } from '../logger/logger.module'
import { BLOCK_REPOSITORY_TOKEN, SUMS_REPOSITORY_TOKEN } from '../common/constants'
import { Connection } from 'typeorm'
import { Block } from '../entities/block.entity'
import { DB_CON_TOKEN } from '../database/database.constants'
import { Sums } from '../entities/sums.entity'

@Module({
  imports: [LoggerModule, ConfigModule, DatabaseModule],
  providers: [
    {
      provide: BLOCK_REPOSITORY_TOKEN,
      useFactory: (connection: Connection) => connection.getRepository(Block),
      inject: [DB_CON_TOKEN],
    },
    {
      provide: SUMS_REPOSITORY_TOKEN,
      useFactory: (connection: Connection) => connection.getRepository(Sums),
      inject: [DB_CON_TOKEN],
    },
    CrawlerService,
  ],
  exports: [CrawlerService],
})
export class CrawlerModule {}
