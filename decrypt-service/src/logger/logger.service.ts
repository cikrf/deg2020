import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '../config/config.service'

@Injectable()
export class LoggerService extends Logger {
  private level: { [key: string]: boolean } = {
    error: false,
    warn: false,
    log: false,
    debug: false,
    verbose: false,
  }

  constructor(private readonly configService: ConfigService) {
    super()
    const logLevel = this.configService.getLogLevel()
    logLevel.map((level) => (this.level[level] = true))
  }

  error(message: any, trace?: string, context?: string): void {
    if (!this.level.error) return
    super.error(message, trace, context)
  }

  warn(message: any, context?: string): void {
    if (!this.level.warn) return
    super.warn(message, context)
  }

  log(message: any, context?: string): void {
    if (!this.level.log) return
    super.log(message, context)
  }

  debug(message: any, context?: string): void {
    if (!this.level.debug) return
    super.debug(message, context)
  }

  verbose(message: any, context?: string): void {
    if (!this.level.verbose) return
    super.verbose(message, context)
  }

  setLogLevel(level: string, value: boolean): void {
    if (Object.keys(this.level).includes(level)) {
      this.level[level] = value
    } else {
      console.log('Wrong log level')
    }
    super.log(this.level, 'LoggerService')
  }
}
