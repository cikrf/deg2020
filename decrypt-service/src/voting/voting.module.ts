import { DynamicModule, Module } from '@nestjs/common'
import { Connection } from 'typeorm'
import {
  IS_MAIN,
  MAIN_REPOSITORY_TOKEN,
  SUMS_REPOSITORY_TOKEN,
  VOTING_CONTRACT,
} from '../common/constants'
import { ConfigService } from '../config/config.service'
import { CryptoModule } from '../crypto/crypto.module'
import { DB_CON_TOKEN } from '../database/database.constants'
import { DatabaseModule } from '../database/database.module'
import { CmdService } from './services/cmd.service'
import { ContractApiService } from './services/contract.api.service'
import { ContractStateService } from './services/contract.state.service'
import { CommonModule } from '../common/common.module'
import { NodeService } from './services/node.service'
import { RtVotingMainController } from './controllers/rt.voting.main.controller'
import { Main, MainType } from '../entities/main.entity'
import { MainService } from './services/main.service'
import { DecryptService } from './services/decrypt.service'
import { Sums } from '../entities/sums.entity'
import { BalanceModule } from '../balance/balance.module'
import { RtVotingContract, WeVotingContract } from '@vostokplatform/voting-contract-api'
import { WeVotingController } from './controllers/we.voting.controller'
import { ConfigModule } from '../config/config.module'
import { CrawlerModule } from '../crawler/crawler.module'
import { DecryptionDBModule } from '../database/models/decryptions/decryptions.module'
import { parseArrayEnv } from '../common/parseArrayEnv'
import { RtVotingDecryptController } from './controllers/rt.voting.decrypt.controller'

import { config } from 'dotenv'

config()

@Module({})
export class VotingModule {
  static register(): DynamicModule {
    const index = process.env.HOSTNAME ? Number(process.env.HOSTNAME.split('-').pop()) : 0
    // tslint:disable-next-line:no-bitwise
    const isMain = process.env.SERVER_CONFIG ? parseArrayEnv(process.env.SERVER_CONFIG)[index] & IS_MAIN : true


    const controllers = []
    if (isMain) {
      if (process.env.CONTRACT_TYPE !== 'common') {
        controllers.push(RtVotingDecryptController, RtVotingMainController)
      } else {
        controllers.push(WeVotingController)
      }
    } else {
      if (process.env.CONTRACT_TYPE !== 'common') {
        controllers.push(RtVotingDecryptController)
      }
    }

    return {
      module: VotingModule,
      imports: [
        DatabaseModule,
        CrawlerModule,
        CryptoModule,
        CommonModule,
        ConfigModule,
        BalanceModule,
        DecryptionDBModule,
      ],
      controllers,
      providers: [
        MainService,
        DecryptService,
        CmdService,
        ContractStateService,
        ContractApiService,
        NodeService,
        {
          provide: SUMS_REPOSITORY_TOKEN,
          useFactory: (connection: Connection) => connection.getRepository(Sums),
          inject: [DB_CON_TOKEN],
        },
        {
          provide: MAIN_REPOSITORY_TOKEN,
          useFactory: (connection: Connection) => connection.getRepository(Main),
          inject: [DB_CON_TOKEN],
        },
        {
          provide: VOTING_CONTRACT,
          useFactory: (configService: ConfigService) =>
            configService.getContractType() !== MainType.common ? RtVotingContract : WeVotingContract,
          inject: [ConfigService],
        },
      ],
    }
  }
}
