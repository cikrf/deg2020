import { HttpModule, Module } from '@nestjs/common'
import { CryptoService } from './crypto.service'
import { ConfigModule } from '../config/config.module'
import { LoggerModule } from '../logger/logger.module'

@Module({
  imports: [HttpModule, ConfigModule, LoggerModule],
  providers: [CryptoService],
  exports: [HttpModule, LoggerModule, CryptoService],
})
export class CryptoModule {}
