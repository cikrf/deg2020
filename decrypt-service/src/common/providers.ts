import { ConfigService } from '../config/config.service'
import { HttpService } from '@nestjs/common'
import { init } from '@vostokplatform/api-token-refresher/fetch'
import fetch from 'isomorphic-fetch'
import { LoggerService } from '../logger/logger.service'
import { AUTHORIZED_FETCH, NODE_CONFIG, WAVES_API } from './constants'
import { IWavesConfig } from '@vostokplatform/waves-api/interfaces'
import { create, MAINNET_CONFIG } from '@vostokplatform/waves-api'

export interface NodeConfig {
  additionalFee: { [key: string]: number }
  minimumFee: { [key: string]: number }
  gostCrypto: boolean
  chainId: string
}

export const providers = [
  {
    provide: AUTHORIZED_FETCH,
    useFactory: async (
      configService: ConfigService,
      loggerService: LoggerService,
      httpService: HttpService,
    ) => {
      const getTokens = async () => {
        const { data } = await httpService
          .post(
            `${configService.getAuthUrl()}/v1/auth/token`,
            {},
            {
              headers: {
                Authorization: `bearer ${configService.getAuthToken()}`,
              },
            },
          )
          .toPromise()
        return data
      }

      const refreshTokens = async (token: string) => {
        const { data } = await httpService
          .post(`${configService.getAuthUrl()}/v1/auth/refresh`, { token })
          .toPromise()
        return data
      }

      try {
        const { access_token, refresh_token } = await getTokens()

        const { fetch: fetch2 } = init({
          authorization: {
            access_token,
            refresh_token,
          },
          async refreshCallback(token: string) {
            try {
              return await refreshTokens(token)
            } catch (e) {
              return getTokens()
            }
          },
        })
        return fetch2
      } catch (error) {
        loggerService.error(error.message, error.trace, 'VotingService')
        process.exit(1)
      }
    },
    inject: [ConfigService, LoggerService, HttpService],
  },
  {
    provide: NODE_CONFIG,
    useFactory: async (
      configService: ConfigService,
      loggerService: LoggerService,
      authorizedFetch: typeof fetch,
    ): Promise<NodeConfig> => {
      const url = `${configService.getNodeUrl()}/node/config`
      try {
        const response = await (await authorizedFetch(url)).json()
        if (!response || response.error) {
          throw new Error(response.error)
        }
        return response
      } catch (e) {
        loggerService.error(`Cant get node config: ${e.message}`, e.trace, 'VotingService')
        process.exit(2)
      }
    },
    inject: [ConfigService, LoggerService, AUTHORIZED_FETCH],
  },
  {
    provide: WAVES_API,
    useFactory: async (
      configService: ConfigService,
      nodeConfig: NodeConfig,
      authorizedFetch: typeof fetch,
    ) => {
      const weApiConfig: IWavesConfig = {
        ...MAINNET_CONFIG,
        nodeAddress: configService.getNodeUrl(),
        networkByte: nodeConfig.chainId.charCodeAt(0),
        crypto: nodeConfig.gostCrypto ? 'gost' : 'waves',
      }

      return create({
        initialConfiguration: weApiConfig,
        fetchInstance: authorizedFetch,
      })
    },
    inject: [ConfigService, NODE_CONFIG, AUTHORIZED_FETCH],
  },
]
