import { NestFactory } from '@nestjs/core'
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import * as express from 'express'
import { ApplicationModule } from './app/app.module'
import { ConfigService } from './config/config.service'
import { LoggerService } from './logger/logger.service'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { IS_MAIN } from './common/constants'
import { ValidationPipe } from '@nestjs/common'
import { HttpExceptionFilter } from './common/http.exception.filter'

async function bootstrap() {
  const server = express()
  server.disable('x-powered-by')
  const app = await NestFactory.create<NestExpressApplication>(
    ApplicationModule,
    new ExpressAdapter(server),
    {
      cors: { origin: ['*'], credentials: true },
    },
  )

  const configService = app.get(ConfigService)

  const logger = app.get(LoggerService)
  logger.log(`Starting with parameters: ${JSON.stringify(configService.getVersionInfo(), null, 2)}`, 'APP')

  if (configService.getServerConfig().filter((c: any) => c & IS_MAIN).length !== 1) {
    logger.error('SERVER_CONFIG must have only one MAIN SERVER', '', 'ConfigService')
    process.exit(1)
  }

  app.enableShutdownHooks()
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())

  const index = process.env.HOSTNAME ? Number(process.env.HOSTNAME.split('-').pop()) : 0
  // @ts-ignore
  process.stdout.write(`${String.fromCharCode(27)}]0;Decrypt #${index}${String.fromCharCode(7)}`)

  const port = configService.getPort()
  if (port) {
    const swaggerOptions = new DocumentBuilder()
      .setTitle('WE Decrypt service')
      .setDescription('WE Decrypt service API description')
      .setVersion(require('../package.json').version)
      .addServer(configService.getSwaggerBasePath())
      .build()

    const document = SwaggerModule.createDocument(app, swaggerOptions)
    SwaggerModule.setup('/docs', app, document)

    await app.listen(configService.getPort())
  } else {
    await app.init()
  }
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
