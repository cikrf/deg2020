import { Inject, Injectable } from '@nestjs/common'
import fetch from 'isomorphic-fetch'
import { ConfigService } from '../../config/config.service'
import { AUTHORIZED_FETCH } from '../../common/constants'
import { VotingInfo } from '../../crawler/interfaces'
import { getDateFromStr } from '../../common/dateUtils'
import { sleep } from '../../common/sleep'

const WAIT_TX_MINING_TIMEOUT = 300 * 1000
const CHECK_TX_MINING_STATUS = 1 * 1000

export type ContractKey = {
  type: string
  value: string
  key: string
}

export interface INodeMinerSuccessResponse {
  sender: string
  senderPublicKey: string
  txId: string
  status: 'Success' | 'Error' | 'Failure'
  code: number | null
  message: string
  timestamp: number
  signature: string
}

export interface INodeErrorResponse {
  error: number
  message: string
}

@Injectable()
export class NodeService {
  private readonly nodeAddress: string

  constructor(
    private readonly configService: ConfigService,
    @Inject(AUTHORIZED_FETCH) private readonly authorizedFetch: typeof fetch,
  ) {
    this.nodeAddress = this.configService.getNodeUrl()
  }

  async getContractKeys(contractId: string, keys: string[]): Promise<ContractKey[]> {
    const url = `${this.nodeAddress}/contracts/${contractId}`
    const response = await this.authorizedFetch(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ keys }),
    })

    if (!response.ok) {
      const resErr = await response.text()
      return Promise.reject(url + ' ' + response.status + ' ' + resErr)
    }

    const res = await response.json()
    if (res.error) {
      return Promise.reject(res.message)
    }

    return res
  }

  async getVotingBase(contractId: string): Promise<VotingInfo | false> {
    try {
      const results: ContractKey = await (
        await this.authorizedFetch(`${this.nodeAddress}/contracts/${contractId}/VOTING_BASE`)
      ).json()
      const raw = JSON.parse(results.value)
      return this.mapVotingBase({ contractId, ...raw })
    } catch (err) {
      console.log(err)
      return false
    }
  }

  async getResults(contractId: string): Promise<number[][]> {
    const results: any = await (
      await this.authorizedFetch(`${this.nodeAddress}/contracts/${contractId}/RESULTS`)
    ).json()

    if (results.error) {
      return results.message
    }
    return JSON.parse(results.value)
  }

  async getContractState(contractId: string): Promise<{ [key: string]: any }> {
    const state = await this.getContractKeys(contractId, ['MAIN_KEY', 'VOTING_BASE', 'SERVERS'])
    let stateServers: ContractKey[] = []

    const serversKeysStr = state.find((contractKey) => contractKey.key === 'SERVERS')
    if (serversKeysStr) {
      const serversKeys = JSON.parse(serversKeysStr.value)
      const decryptKeys = serversKeys.map((s: string) => {
        const str = s.split('_')
        return 'DECRYPTION_' + str[1]
      })
      stateServers = await this.getContractKeys(contractId, [...serversKeys, ...decryptKeys])
    }

    return [...state, ...stateServers].reduce((acc, { key, value }) => {
      let parsed: object | string
      try {
        parsed = JSON.parse(value)
      } catch (e) {
        parsed = {
          status: '#INVALID',
          raw: value,
        }
      }
      return { ...acc, [key]: parsed }
    }, {})
  }

  async getTransactionStatus(txId: string): Promise<INodeMinerSuccessResponse[] | INodeErrorResponse>  {
    const url = `${this.nodeAddress}/contracts/status/${txId}`
    const response = await this.authorizedFetch(url)
    return response.json()
  }

  waitForTxMining(txId: string) {
    let isFinished = false

    const requestTxStatus = async (wait: number): Promise<void>  => {
      await sleep(wait)
      if(isFinished){
        return
      }

      let success = false
      try {
        const response = await this.getTransactionStatus(txId)

        success = Array.isArray(response) && response.some(
          nodeResponse => nodeResponse.status === 'Success',
        )
      }
      catch{
        success = false
      }

      if(!success && !isFinished){
        return requestTxStatus(CHECK_TX_MINING_STATUS)
      }

      isFinished = true
      return
    }

    return Promise.race([
      requestTxStatus(0),
      sleep(WAIT_TX_MINING_TIMEOUT).then(() => {
        if (isFinished) {
          return
        }

        isFinished = true
        return Promise.reject(`transaction ${txId} is not mined in ${WAIT_TX_MINING_TIMEOUT} sec`)
      }),
    ])
  }

  mapVotingBase(data: any): VotingInfo {
    return {
      pollId: data.pollId,
      contractId: data.contractId,
      dateStart: getDateFromStr(data.dateStart),
      dateEnd: data.dateEnd ? getDateFromStr(data.dateEnd) : undefined,
      dimension: typeof data.dimension === 'string' ? JSON.parse(data.dimension) : data.dimension,
      k: +data.k,
      admins: data.admins,
      participants: data.participants,
      blindSigModulo: data.blindSigModulo,
      blindSigExponent: data.blindSigExponent,
    }
  }

  async getError(txId: string): Promise<string[]> {
    const result = await this.getTransactionStatus(txId)
    if (Array.isArray(result)) {
      return [...new Set(result.map((r) => r.message))]
    } else {
      return ['Unknown error']
    }
  }
}
