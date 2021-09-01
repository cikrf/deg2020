import { Module } from '@nestjs/common'
import { Connection } from 'typeorm'
import { ConfigModule } from '../../../config/config.module'
import { Decryption } from '../../../entities/decryption.entity'
import { DecryptionDB } from './decryptions.service'
import { DB_CON_TOKEN } from '../../database.constants'
import { DECRYPTION_REPOSITORY_TOKEN } from '../../../common/constants'
import { DatabaseModule } from '../../database.module'

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [
    {
      provide: DECRYPTION_REPOSITORY_TOKEN,
      useFactory: (connection: Connection) => connection.getRepository(Decryption),
      inject: [DB_CON_TOKEN],
    },
    DecryptionDB,
  ],
  exports: [DecryptionDB],
})
export class DecryptionDBModule {}
