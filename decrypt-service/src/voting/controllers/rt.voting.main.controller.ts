import { Body, Controller, Get, HttpException, Inject, Param, Post, Put, UseInterceptors } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { ContractApiService } from '../services/contract.api.service'
import {
  RtVotingCreateRequestDTO,
  RtVotingGetResponseDTO,
  RtVotingPutResponseDTO,
  VotingCreateResponseDTO,
} from './dto'
import { MainService } from '../services/main.service'
import { Main, MainStatus } from '../../entities/main.entity'
import { NodeService } from '../services/node.service'
import { LoggerService } from '../../logger/logger.service'
import { MAIN_REPOSITORY_TOKEN } from '../../common/constants'
import { Repository } from 'typeorm'
import { ConfigService } from '../../config/config.service'
import { CryptoService } from '../../crypto/crypto.service'
import { IngnoreBodyLog, LoggerInterceptor } from '../../logger/logger.interceptor'
import { RtVotingAddCommissionPubKeyRequestDTO } from './dto/addCommissionPubKey.req.dto'
import { RtVotingAddCommissionPrivKeyRequestDTO } from './dto/addCommissionPrivKey.req.dto'

@ApiTags('Poll')
@Controller('/v1/poll')
@UseInterceptors(LoggerInterceptor)
export class RtVotingMainController {
  constructor(
    private readonly contractApiService: ContractApiService,
    private readonly mainService: MainService,
    private readonly nodeService: NodeService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
    @Inject(MAIN_REPOSITORY_TOKEN) private readonly mainRepository: Repository<Main>,
  ) {}

  @Post('')
  @ApiResponse({
    type: VotingCreateResponseDTO,
    description: 'Create poll',
  })
  async createPoll(@Body() request: RtVotingCreateRequestDTO) {
    try {
      if (request.dateStart < Date.now() + this.configService.getMinDateStartInterval()) {
        throw new Error('At least 5 min needed for DKG process')
      }

      const exist = await this.mainRepository.findOne({ where: { pollId: request.pollId } })
      if (exist) {
        throw new Error('Voting with this pollId already exists')
      }

      const contractId = await this.contractApiService.initiateVoting(request)
      this.loggerService.debug(`Start creating voting ${contractId}`, 'MainService')
      await this.mainRepository.save({
        contractId,
        ...request,
        dimension: request.dimension,
        dateStart: new Date(request.dateStart),
        status: MainStatus.pollInitiated,
      })

      this.addVotingToMainService(contractId)

      return {
        pollId: request.pollId,
        txId: contractId,
      }
    } catch (err) {
      this.loggerService.error(err.message, err.trace, 'MainService')
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

  private async addVotingToMainService(contractId: string){
    try {
      await this.nodeService.waitForTxMining(contractId)
      await this.mainRepository.update({ contractId }, { status:  MainStatus.pollStarted })
      await this.mainService.subscribe(contractId)
    } catch (err) {
      await this.mainRepository.update({ contractId }, { status: MainStatus.pollFailed })
      this.loggerService.error(err.message, err, 'MainService')
    }
  }

  @Put(':id/finalize')
  @ApiResponse({
    type: RtVotingPutResponseDTO,
    description: 'Finalize poll',
  })
  async finalizePoll(@Param('id') id: string) {
    try {
      await this.mainService.finishVoting(id)
      return { result: 'completed' }
    } catch (err) {
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

  @Get(':id')
  @ApiResponse({
    type: RtVotingGetResponseDTO,
    description: 'Get poll information',
  })
  async getPoll(@Param('id') id: string) {
    try {
      return await this.mainService.getStatus(id)
    } catch (err) {
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

  @Put(':id/addCommissionPubKey')
  @ApiResponse({
    type: RtVotingPutResponseDTO,
    description: 'Add commission public key',
  })
  async addCommissionPubKey(@Param('id') id: string, @Body() request: RtVotingAddCommissionPubKeyRequestDTO) {
    try {

      const isValidCommissionPubKey = await this.cryptoService.pointValidate([request.commissionPubKey.x, request.commissionPubKey.y], 'bitcoin')
      if (!isValidCommissionPubKey) {
        throw new Error('commissionPubKey is not valid elliptic curve point')
      }

      await this.mainService.addCommissionPubKey(id, request.commissionPubKey)
      return {
        result: 'completed',
      }
    } catch (err) {
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

  @Put(':id/addCommissionPrivKey')
  @ApiResponse({
    type: RtVotingPutResponseDTO,
    description: 'Add commission private key',
  })
  @IngnoreBodyLog()
  async addCommissionPrivKey(@Param('id') id: string, @Body() request: RtVotingAddCommissionPrivKeyRequestDTO) {
    try {
      await this.mainService.addCommissionPrivKey(id, request.commissionPrivKey)
      return {
        result: 'completed',
      }
    } catch (err) {
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

  @Put(':id/recount')
  @ApiResponse({
    description: 'Try to count results again',
  })
  async recount(@Param('id') id: string) {
    try {
      await this.mainService.recount(id)
      return {
        result: 'completed',
      }
    } catch (err) {
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }

}
