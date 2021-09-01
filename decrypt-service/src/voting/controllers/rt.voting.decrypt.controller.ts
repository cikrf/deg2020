import { Controller, Get, HttpException, Param, UseInterceptors } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { RtVotingPrivateKeyDto } from './dto/rt.voting.private.key.dto'
import { DecryptionDB } from '../../database/models/decryptions/decryptions.service'
import { ContractStateService } from '../services/contract.state.service'
import { LoggerInterceptor } from '../../logger/logger.interceptor'

@ApiTags('Poll')
@Controller('/v1/poll')
@UseInterceptors(LoggerInterceptor)
export class RtVotingDecryptController {
  constructor(
    private readonly decryptionDB: DecryptionDB,
    private readonly contractStateService: ContractStateService,
  ) {}

  @Get(':id/decryptionKey')
  @ApiResponse({
    type: RtVotingPrivateKeyDto,
    description: 'Get poll private key',
  })
  async getDecryptionKey(@Param('id') id: string) {
    try {
      const { contractId, privateKey } = await this.decryptionDB.findOneOrFailByPollId(id)
      const contractState = await this.contractStateService.getActualState(contractId)
      if (contractState.isDecryptionDelivered() && contractState.isFinished()) {
        return {
          decryptId: contractState.getOwnI(),
          decryptPrivKey: privateKey,
        }
      } else {
        throw new Error('Poll is running, сouldn\'t disclose private key')
      }
    } catch (err) {
      throw new HttpException({ message: err.message }, err.status || 400)
    }
  }
}
