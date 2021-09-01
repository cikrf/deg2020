import { Module } from '@nestjs/common'
import { BalanceService } from './balance.service'
import { ConfigModule } from '../config/config.module'
import { LoggerModule } from '../logger/logger.module'
import { CommonModule } from '../common/common.module'

@Module({
  imports: [CommonModule, ConfigModule, LoggerModule],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
