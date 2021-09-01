import { CallHandler, ExecutionContext, HttpException, Inject, NestInterceptor, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request, Response } from 'express'
import { LoggerService } from './logger.service'

export const IngnoreBodyLog = (...roles: string[]) => SetMetadata('IngnoreBodyLog', true)

export class LoggerInterceptor implements NestInterceptor {

  constructor(
    private readonly reflector: Reflector,
    @Inject('LoggerService') private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {

    const req: Request = context.switchToHttp().getRequest()
    const ingoreBodyLog = this.reflector.get<boolean>('IngnoreBodyLog', context.getHandler())

    const { originalUrl, body } = req

    return next
      .handle()
      .pipe(
        tap({
          next: (): void => {
            const res: Response = context.switchToHttp().getResponse<Response>()
            const { statusCode } = res
            const message = ingoreBodyLog
              ? `${originalUrl} [${statusCode}]`
              : `${originalUrl} [${statusCode}] with body: ${JSON.stringify(body, null, 2)}`

            this.loggerService.log(message, 'RequestLogger')
          },
          error: (error: Error): void => {
            if (error instanceof HttpException) {
              const statusCode = error.getStatus()
              const message = ingoreBodyLog
                ? `${originalUrl} [${statusCode}]`
                : `${originalUrl} [${statusCode}] with body: ${JSON.stringify(body, null, 2)}`
              this.loggerService.error(message, '', 'RequestLogger')
            }
          },
        }),
      )
  }
}
