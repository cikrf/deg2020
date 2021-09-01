import { Body, Controller, Get, HttpException, Inject, Param, Post, UseInterceptors } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { ContractApiService } from '../services/contract.api.service'
import { VotingCreateResponseDTO, WeVotingCreateRequestDTO, WeVotingGetResponseDTO } from './dto'
import { MainService } from '../services/main.service'
import { chunk } from 'lodash'
import { Main, MainStatus } from '../../entities/main.entity'
import { NodeService } from '../services/node.service'
import { LoggerService } from '../../logger/logger.service'
import { MAIN_REPOSITORY_TOKEN, POLL_MIN_DURATION } from '../../common/constants'
import { Repository } from 'typeorm'
import { BalanceService } from '../../balance/balance.service'
import { ConfigService } from '../../config/config.service'
import { LoggerInterceptor } from '../../logger/logger.interceptor'

@ApiTags('Poll')
@Controller('/v1/poll')
@UseInterceptors(LoggerInterceptor)
export class WeVotingController {
  constructor(
    private readonly contractApiService: ContractApiService,
    private readonly mainService: MainService,
    private readonly nodeService: NodeService,
    private readonly loggerService: LoggerService,
    private readonly balanceService: BalanceService,
    private readonly configService: ConfigService,
    @Inject(MAIN_REPOSITORY_TOKEN) private readonly mainRepository: Repository<Main>,
  ) {}

  @Post('')
  @ApiResponse({
    type: VotingCreateResponseDTO,
    description: 'Create poll',
  })
  async createPoll(@Body() request: WeVotingCreateRequestDTO) {
    try {
      if (request.dateStart < Date.now() + this.configService.getMinDateStartInterval()) {
        throw new Error('At least 5 min needed for DKG process')
      }

      if (request.dateEnd - request.dateStart < POLL_MIN_DURATION * 1000) {
        throw new Error('Invalid dateEnd. Min poll duration ' + POLL_MIN_DURATION + ' sec')
      }

      const contractId = await this.contractApiService.initiateVoting(request)
      this.loggerService.debug(`Start creating voting ${contractId}`, 'MainService')
      const main = this.mainRepository.create({
        contractId,
        ...request,
        dimension: request.dimension,
        dateStart: new Date(request.dateStart),
        dateEnd: new Date(request.dateEnd),
        status: MainStatus.pollInitiated,
      })
      await this.mainRepository.save(main)

      this.addVotingToMainService(main)

      return {
        pollId: request.pollId,
        txId: contractId,
      }
    } catch (err) {
      this.loggerService.error(err.message, err, 'MainService')
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

  private async addVotingToMainService(main: Main) {
    try {
      await this.nodeService.waitForTxMining(main.contractId)

      const chunks = chunk(main.participants, 500)
      await Promise.all(
        chunks.map(async (chunkElem) =>
          this.contractApiService.addParticipants(main, chunkElem),
        ),
      )
      await this.balanceService.transferTokensToVoters(main.participants)
      await this.mainRepository.update({ contractId: main.contractId }, { status: MainStatus.pollStarted })
      await this.mainService.subscribe(main.contractId)

    } catch (err) {
      await this.mainRepository.update({ contractId: main.contractId }, { status: MainStatus.pollFailed })
      this.loggerService.error(err.message, err, 'MainService')
    }
  }

  @Get(':id')
  @ApiResponse({
    type: WeVotingGetResponseDTO,
    description: 'Get poll information',
  })
  async getPoll(@Param('id') id: string) {
    try {
      return await this.mainService.getStatus(id)
    } catch (err) {
      this.loggerService.error(err.message, err, 'MainService')
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }
}
