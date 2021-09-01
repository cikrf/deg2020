import { DynamicModule, Inject, Module, OnModuleDestroy } from '@nestjs/common'
import { Connection } from 'typeorm'
import { ConfigModule } from '../config/config.module'
import { ConfigService } from '../config/config.service'
import { CRAWLER_DB_CON_TOKEN, DB_CON_TOKEN } from './database.constants'
import { pgProviders } from './pg.providers'

@Module({
  imports: [ConfigModule],
  providers: [...pgProviders],
  exports: [...pgProviders],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(DB_CON_TOKEN) private readonly dbConnection: Connection,
    @Inject(CRAWLER_DB_CON_TOKEN) private readonly crawlerDbConnection: Connection,
  ) {}

  static forRoot(dbName?: string): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        ...pgProviders,
        {
          provide: ConfigService,
          useValue: new ConfigService(dbName),
        },
      ],
      exports: pgProviders,
    }
  }

  onModuleDestroy(): void {
    this.dbConnection.close()
    this.crawlerDbConnection.close()
  }
}
