import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { LoggerService } from '../logger/logger.service'
import { Cron, CronExpression } from '@nestjs/schedule'
import { AUTHORIZED_FETCH, NODE_CONFIG, TX_104, TX_11, TX_4, WAVES_API } from '../common/constants'
import { IWavesAPI } from '@vostokplatform/waves-api'
import fetch from 'isomorphic-fetch'
import { NodeConfig } from '../common/providers'
import { chunk } from 'lodash'
import BigNumber from 'bignumber.js'

@Injectable()
export class BalanceService {
  private readonly decryptAddresses: string[]
  private readonly minimalBalance: number
  private readonly serviceTransferAmount: string
  private readonly voterTransferAmount: number
  private readonly enabled: boolean = true

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    @Inject(NODE_CONFIG) private readonly nodeConfig: NodeConfig,
    @Inject(WAVES_API) private readonly wavesApi: IWavesAPI,
    @Inject(AUTHORIZED_FETCH) private readonly authorizedFetch: typeof fetch,
  ) {
    const publicKeys = this.configService.getDecryptPublicKeys()
    this.decryptAddresses = publicKeys.map((publicKey) => {
      try {
        return this.wavesApi.tools.getAddressFromPublicKey(publicKey)
      } catch (e) {
        this.loggerService.error(
          `Can not get service address from public key ${publicKey}`, '', 'BalanceService',
        )
        process.exit(1)
      }
    })
    this.minimalBalance = this.configService.getMinimalServiceBalance()
    this.serviceTransferAmount = this.configService.getServiceTransferAmount().toString()
    this.voterTransferAmount = this.nodeConfig.minimumFee[TX_104] * this.configService.getPossibleVotesNum()
    this.enabled = this.configService.getBalanceWatcherEnabled()
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'balanceWatcher' })
  async handleCron() {
    if (!this.enabled) {
      return
    }
    try {
      const balances = await Promise.all(
        this.decryptAddresses.map(async (address) =>
          (await this.authorizedFetch(`${this.configService.getNodeUrl()}/addresses/balance/${address}`)).json(),
        ),
      )
      balances.map((balanceObject, i) => {
        if (balanceObject.balance < this.minimalBalance) {
          this.loggerService.log(
            `Balance of decrypt #${i} is less than ${this.minimalBalance}. Sending ${this.serviceTransferAmount}`,
            'BalanceService',
          );
          (this.wavesApi.API.Node.transactions as any).broadcastFromClientAddress(
            'transfer',
            {
              amount: this.serviceTransferAmount,
              assetId: 'WAVES',
              attachment: '',
              fee: this.nodeConfig.minimumFee[TX_4],
              recipient: balanceObject.address,
              timestamp: Date.now(),
            },
            {
              privateKey: this.configService.getMainWalletPrivateKey(),
              publicKey: this.configService.getMainWalletPublicKey(),
            },
          )
        }
      })
    } catch (e) {
      this.loggerService.error(
        `Balance of decrypt # is less than ${this.configService.getMinimalServiceBalance()}`, '', 'BalanceService',
      )
    }
  }

  private calculateFeeMassTransfer(
    count: number,
    baseCommissionMassTransfer: number,
    addCommissionMassTransfer: number,
  ) {
    // (BigInt(baseCommissionMassTransfer) + BigInt(addCommissionMassTransfer)) / 2n * BigInt(count + 1)
    const Bn: any = BigNumber
    return Bn(baseCommissionMassTransfer)
      .plus(
        Bn(addCommissionMassTransfer)
          .dividedBy(2)
          .multipliedBy(count + 1),
      )
      .toString()
  }

  async transferTokensToVoters(publicKeys: string[]) {
    if (!this.enabled) {
      return
    }

    const votersAddresses: string[] = publicKeys.map((publicKey) =>
      this.wavesApi.tools.getAddressFromPublicKey(publicKey),
    )
    if (votersAddresses.length !== publicKeys.length) {
      this.loggerService.warn(
        `Can't get address for token transfer for some voters`, 'BalanceService',
      )
    }

    const transactions: any = this.wavesApi.API.Node.transactions
    const chunks: string[][] = chunk(votersAddresses, 100)

    await Promise.all(
      chunks.map((chunkElem) => {
        return transactions.broadcastFromClientAddress(
          'massTransfer',
          {
            transfers: chunkElem.map((address) => {
              return {
                recipient: address,
                amount: this.voterTransferAmount,
              }
            }),
            assetId: 'WAVES',
            timestamp: Date.now(),
            fee: this.calculateFeeMassTransfer(
              chunk.length,
              this.nodeConfig.minimumFee[TX_11],
              this.nodeConfig.additionalFee[TX_11],
            ),
          },
          {
            privateKey: this.configService.getMainWalletPrivateKey(),
            publicKey: this.configService.getMainWalletPublicKey(),
          },
        )
      }),
    )
  }
}
