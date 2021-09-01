import { Inject, Injectable } from '@nestjs/common'
import { Decryption, DecryptionStatus } from '../../../entities/decryption.entity'
import { Repository, Not, DeepPartial } from 'typeorm'
import { DECRYPTION_REPOSITORY_TOKEN } from '../../../common/constants'
import { decryptAes256, encryptAes256 } from '../../../common/encryptUtils'
import { ConfigService } from '../../../config/config.service'
import { IKeys } from '../../../crypto/interfaces'

@Injectable()
export class DecryptionDB {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DECRYPTION_REPOSITORY_TOKEN)
    private readonly decryptionRepository: Repository<Decryption>,
  ) {}

  createInstance = (entityLike: DeepPartial<Decryption>) =>
    this.decryptionRepository.create(entityLike)

  async findNotFinishedVotings() {
    const votings = await this.decryptionRepository.find({
      where: {
        status: Not(DecryptionStatus.finished),
      },
    })

    return votings.map((voting) => ({
      ...voting,
      privateKey: this.decrypt(voting.privateKey),
    }))
  }

  save(decryption: Decryption) {
    return this.decryptionRepository.save({
      ...decryption,
      privateKey: this.encrypt(decryption.privateKey),
    })
  }

  getContractsWithEmptySum(): Promise<Array<{ contract_id: string; dimension: number[] }>> {
    return this.decryptionRepository.query(
      `SELECT d.contract_id, d.dimension FROM decryption d LEFT JOIN sums s ON d.contract_id = s.contract_id
        WHERE s IS NULL`,
    )
  }

  updateDateEnd(contractId: string, dateEnd: Date) {
    return this.decryptionRepository.update({ contractId }, { dateEnd })
  }

  updateRound(contractId: string, status: DecryptionStatus, round: number) {
    return this.decryptionRepository.update({ contractId }, { status, round })
  }

  updateRoundWithKeys(contractId: string, status: DecryptionStatus, round: number, keys: IKeys) {
    const upd = {
      status,
      round,
      ...keys,
      privateKey: this.encrypt(keys.privateKey),
    }
    return this.decryptionRepository.update({ contractId }, upd)
  }

  async getAllContractIds() {
    const res = await this.decryptionRepository.query('SELECT contract_id FROM decryption')
    return res.map((row: { contract_id: string }) => row.contract_id)
  }

  async findOneOrFail(contractId: string) {
    const decryption = await this.decryptionRepository.findOneOrFail(contractId)
    return {
      ...decryption,
      privateKey: this.decrypt(decryption.privateKey),
    }
  }

  async findOneOrFailByPollId(pollId: string) {
    const decryption = await this.decryptionRepository.findOneOrFail({ pollId })
    return {
      ...decryption,
      privateKey: this.decrypt(decryption.privateKey),
    }
  }

  finishAllVotes() {
    return this.decryptionRepository
      .createQueryBuilder('voting')
      .update({ status: DecryptionStatus.finished })
      .execute()
  }

  private encrypt(key: string) {
    try {
      return encryptAes256(key, this.configService.getEncryptionSalt())
    } catch (err) {
      throw new Error('Can not encrypt privateKey ' + key)
    }
  }

  private decrypt(key: string) {
    try {
      return decryptAes256(key, this.configService.getEncryptionSalt())
    } catch (err) {
      throw new Error('Can not decrypt privateKey ' + key)
    }
  }
}
