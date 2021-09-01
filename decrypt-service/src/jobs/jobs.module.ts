import { JobsService } from './jobs.service'
import { Global, Module } from '@nestjs/common'
import { LoggerModule } from '../logger/logger.module'

@Global()
@Module({
  imports: [LoggerModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
