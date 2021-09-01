import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule } from '../config/config.module'
import { providers } from './providers'
import { LoggerModule } from '../logger/logger.module'
import { AUTHORIZED_FETCH, NODE_CONFIG, WAVES_API } from './constants'

@Module({
  imports: [LoggerModule, ConfigModule, HttpModule],
  providers,
  exports: [AUTHORIZED_FETCH, NODE_CONFIG, WAVES_API],
})
export class CommonModule {}
