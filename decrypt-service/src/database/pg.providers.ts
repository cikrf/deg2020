import { join } from 'path'
import { createConnection } from 'typeorm'
import { ConfigService } from '../config/config.service'
import { CRAWLER_DB_CON_TOKEN, DB_CON_TOKEN } from './database.constants'

export const pgProviders = [
  {
    provide: DB_CON_TOKEN,
    useFactory: async (configService: ConfigService) => {
      return createConnection({
        type: 'postgres',
        name: 'default',
        ...configService.getPgOptions(),
        entities: [join(__dirname, '..', '/**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, '..', 'migrations/*{.ts,.js}')],
        migrationsRun: true,
        // synchronize: true,
      })
    },
    inject: [ConfigService],
  },
  {
    provide: CRAWLER_DB_CON_TOKEN,
    useFactory: async (configService: ConfigService) => {
      return createConnection({
        type: 'postgres',
        name: 'test',
        ...configService.getCrawlerPgOptions(),
      })
    },
    inject: [ConfigService],
  },
]
