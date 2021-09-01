import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { Decryption, Transaction, TransactionParam, Vote, VotingInfo } from './interfaces'
import { ConfigService } from '../config/config.service'
import { LoggerService } from '../logger/logger.service'
import { Client } from 'pg'
import { MoreThan, Repository } from 'typeorm'
import { BLOCK_REPOSITORY_TOKEN, SUMS_REPOSITORY_TOKEN } from '../common/constants'
import { Block } from '../entities/block.entity'
import { CronExpression } from '@nestjs/schedule'
import { JobsService } from '../jobs/jobs.service'
import { getDateFromStr, getIsoStringFromStr } from '../common/dateUtils'

@Injectable()
export class CrawlerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private pg: Client
  private readonly crawlerLag: number = 1
  private readonly rollbackCheckBlockAmount: number = 100
  private height: number = 0
  private rollback: boolean = true

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly jobsService: JobsService,
    @Inject(BLOCK_REPOSITORY_TOKEN) private readonly blockRepository: Repository<Block>,
    @Inject(SUMS_REPOSITORY_TOKEN) private readonly sumsRepository: Repository<Block>,
  ) {
    const pgConfig = this.configService.getCrawlerPgOptions()
    this.pg = new Client({
      user: pgConfig.username,
      host: pgConfig.host,
      database: pgConfig.database,
      password: pgConfig.password,
      port: pgConfig.port,
      ssl: pgConfig.ssl,
    })
    this.pg.connect((err) => {
      if (err) {
        this.loggerService.error('Crawler database not ready', '', 'CrawlerService')
        process.exit(1)
      }
    })

    this.crawlerLag = this.configService.getCrawlerLag()
    this.rollbackCheckBlockAmount = this.configService.getRollbackCheckBlocksAmount()
  }

  onApplicationBootstrap() {
    this.jobsService.addJob('syncBlocks', this.syncBlocks.bind(this), { start: true })
    this.jobsService.addJob('deadCrawlerCheck', this.deadCrawlerCheck.bind(this), { cronTime: CronExpression.EVERY_30_SECONDS })
  }

  async deadCrawlerCheck() {
    const lastBlockTS: any = (await this.pg.query(`SELECT time_stamp FROM blocks ORDER BY height DESC LIMIT 1`)).rows
    if (lastBlockTS[0] && lastBlockTS[0].time_stamp < new Date(Date.now() - this.configService.getDeadCrawlerTimeout())
    ) {
      this.loggerService.error('Crawler is dead!', '', 'CrawlerService')
    }
  }

  async syncBlocks() {
    try {
      const lastLocalBlocks = await this.blockRepository.query(
        'SELECT height, signature FROM blocks ORDER BY height DESC LIMIT $1',
        [this.rollbackCheckBlockAmount],
      )
      const localHeight = lastLocalBlocks.length ? lastLocalBlocks[0].height : 0
      const crawlerBlocks = (
        await this.pg.query<Block>(
          `SELECT height, signature FROM blocks WHERE height <= $1 ORDER BY height DESC LIMIT $2 `,
          [localHeight, this.rollbackCheckBlockAmount],
        )
      ).rows
      const blocksEqual =
        lastLocalBlocks.length &&
        lastLocalBlocks.every((llb: Block) => {
          const crawlerBlock = crawlerBlocks.find((cb) => cb.height === llb.height)
          return crawlerBlock && crawlerBlock.signature === llb.signature
        })
      if (blocksEqual || localHeight === 0) {
        if (this.rollback) {
          this.rollback = false
          this.loggerService.warn('Resuming jobs...', 'CrawlerService')
          await this.jobsService.resumeJobs()
        }
        const newBlocks = (
          await this.pg.query<Block>(
            `SELECT height, signature FROM blocks
              WHERE height > $1 AND height <= ( SELECT height FROM blocks ORDER BY height DESC LIMIT 1 OFFSET $2)
              LIMIT $3`,
            [localHeight, this.crawlerLag, this.rollbackCheckBlockAmount],
          )
        ).rows
        if (newBlocks.length) {
          if (newBlocks.length > 1) {
            this.loggerService.warn(
              `Chasing crawler db... Syncing ${newBlocks.length} blocks with crawler db`, 'CrawlerService',
            )
          }
          await this.blockRepository.save(
            newBlocks.map((block: Block) => this.blockRepository.create({ ...block })),
          )
          this.height = newBlocks.reduce(
            (acc, block) => (block.height > acc ? block.height : acc),
            0,
          )
        }
      } else {
        if (!this.rollback) {
          this.rollback = true
          await this.jobsService.pauseJobs(['syncBlocks'])
        }
        const firstNotEqual = [...lastLocalBlocks].reverse().find((llb: Block) => {
          const crawlerBlock = crawlerBlocks.find((cb) => cb.height === llb.height)
          return crawlerBlock && crawlerBlock.signature !== llb.signature
        })

        const deleteFromHeight = !firstNotEqual ? crawlerBlocks[0].height : firstNotEqual.height - 1

        this.loggerService.warn(`Rollback to height ${deleteFromHeight}`, 'CrawlerService')
        await this.sumsRepository.delete({ height: MoreThan(deleteFromHeight) })
        await this.blockRepository.delete({ height: MoreThan(deleteFromHeight) })
        this.height = deleteFromHeight
      }
    } catch (e) {
      this.loggerService.error(e.message, '', 'CrawlerService')
    }
  }

  async onApplicationShutdown() {
    await this.pg.end()
  }

  async getCurrentBlockInfo(): Promise<{ time_stamp: Date; height: number }> {
    // const query = `SELECT time_stamp, height FROM blocks ORDER BY height DESC LIMIT 1 OFFSET $1`
    // const result = (await this.pg.query(query, [this.crawlerLag])).rows
    const query = `SELECT time_stamp, height FROM blocks WHERE height = $1`
    const result = (await this.pg.query(query, [this.height])).rows
    return result[0] ? result[0] : { time_stamp: new Date(0), height: 0 }
  }

  async isBlockchainReady(date: Date): Promise<boolean> {
    const { time_stamp } = await this.getCurrentBlockInfo()
    return time_stamp >= date
  }

  async getWrongShadowTxId(contractId: string, publicKey: string, round: number): Promise<string> {
    const serverKey = `SERVER_${publicKey}`
    const query = `SELECT t.id
      FROM
        txs_104 t
      JOIN txs_104_params p1 ON p1.tx_id = t.id AND p1.param_value_string = 'dkgShadows'
      JOIN txs_104_params p2 ON p2.tx_id = t.id AND p2.param_value_integer = $3 AND p2.param_key = 'round'
      JOIN txs_104_results r ON t.id = r.tx_id
      WHERE
        r.result_key = $2 AND
        t.contract_id = $1`

    const result = (await this.pg.query(query, [contractId, serverKey, round])).rows

    return result[0] ? result[0].id : ''
  }

  async getFailedBulletinsTx(contractId: string, height: number): Promise<string[]> {
    const query = `SELECT t.id FROM txs_104 t JOIN txs_104_results r ON t.id = r.tx_id WHERE t.contract_id = $1 AND t.height < $2 AND r.result_key LIKE 'FAIL%vote'`
    const rawFailed = (await this.pg.query(query, [contractId, height])).rows
    return rawFailed.map((raw) => raw.id)
  }

  async getFailedBulletinsNum(contractId: string, height: number): Promise<number> {
    const query = `SELECT COUNT(t) FROM txs_104 t JOIN txs_104_results r ON t.id = r.tx_id WHERE t.contract_id = $1 AND t.height < $2 AND r.result_key LIKE 'FAIL%vote'`
    const num = (await this.pg.query(query, [contractId, height])).rows[0].count
    return num
  }

  async getVotes(contractId: string, height: number, limit: number, offset: number): Promise<Vote[]> {
    // tslint:disable:max-line-length
    const query = `
      (WITH currentChunk AS (
      SELECT t.id, t.sender_public_key FROM txs_104 t JOIN txs_104_params p ON p.tx_id = t.id WHERE t.contract_id = $1 AND p.param_key = 'vote' AND t.height <= $2 ORDER BY t.index ASC LIMIT $3 OFFSET $4),
      prevChunk AS (SELECT t.id, t.sender_public_key FROM txs_104 t JOIN txs_104_params p ON p.tx_id = t.id WHERE t.contract_id = $1 AND p.param_key = 'vote' AND t.height <= $2 ORDER BY t.index ASC  LIMIT $4),
      alreadyVoted AS (SELECT * FROM prevChunk prev WHERE sender_public_key IN (SELECT sender_public_key FROM currentChunk)),
      failed AS (SELECT t.id FROM txs_104 t JOIN txs_104_results r ON t.id = r.tx_id WHERE t.contract_id = $1 AND t.height <= $2 AND r.result_key LIKE 'FAIL%vote')

      SELECT DISTINCT ON (sender_public_key) t.id, t.sender_public_key, t.index, t.time_stamp, t.height, p_vote.param_value_string as "vote", p_blind_sig.param_value_string as "blind_sig", 1 as mul, (SELECT SUM(1) FROM currentChunk) as n
        FROM
          txs_104 t
            LEFT JOIN failed f ON t.id = f.id
            JOIN currentChunk c ON c.id = t.id
            JOIN txs_104_params p_vote ON p_vote.tx_id = c.id AND p_vote.param_key = 'vote'
            LEFT JOIN txs_104_params p_blind_sig ON p_blind_sig.tx_id = c.id AND p_blind_sig.param_key = 'blindSig'
        WHERE
          t.height <= $2
        AND f.id IS NULL
        ORDER BY sender_public_key, t.index DESC)

      UNION

      (WITH
      currentChunk AS (SELECT t.id, t.sender_public_key FROM txs_104 t JOIN txs_104_params p ON p.tx_id = t.id WHERE t.contract_id = $1 AND p.param_key = 'vote' AND t.height <= $2 ORDER BY t.index ASC LIMIT $3 OFFSET $4),
      prevChunk AS (SELECT t.id, t.sender_public_key FROM txs_104 t JOIN txs_104_params p ON p.tx_id = t.id WHERE t.contract_id = $1 AND p.param_key = 'vote' AND t.height <= $2 ORDER BY t.index ASC LIMIT $4),
      alreadyVoted AS (SELECT * FROM prevChunk prev WHERE sender_public_key IN (SELECT sender_public_key FROM currentChunk)),
      failed AS (SELECT t.id FROM txs_104 t JOIN txs_104_results r ON t.id = r.tx_id WHERE t.contract_id = $1 AND t.height <= $2 AND r.result_key LIKE 'FAIL%vote')

      SELECT DISTINCT ON (sender_public_key) t.id, t.sender_public_key, t.index, t.time_stamp, t.height, p_vote.param_value_string as "vote", p_blind_sig.param_value_string as "blind_sig", -1 as mul, (SELECT SUM(1) FROM currentChunk) as n
        FROM
          txs_104 t
            LEFT JOIN failed f ON t.id = f.id
            JOIN alreadyVoted av ON av.id = t.id
            JOIN txs_104_params p_vote ON p_vote.tx_id = av.id AND p_vote.param_key = 'vote'
            LEFT JOIN txs_104_params p_blind_sig ON p_blind_sig.tx_id = av.id AND p_blind_sig.param_key = 'blindSig'
        WHERE
          t.height <= $2
        AND f.id IS NULL
        ORDER BY sender_public_key, t.index DESC);
    `
    const rawVotes = (await this.pg.query(query, [contractId, height, limit, offset])).rows
    return rawVotes.map(this.mapVote)
  }

  async getVotesCount(contractId: string) {
    const query = `SELECT COUNT(*) as all, COUNT(DISTINCT t.sender_public_key) as unique
      FROM txs_104 t JOIN txs_104_params p ON p.tx_id = t.id
      WHERE t.contract_id = $1 AND p.param_key = 'vote'`

    const rawVotes = (await this.pg.query(query, [contractId])).rows
    const { all, unique } = rawVotes[0]

    return {
      all: +all,
      unique: +unique,
    }
  }

  async getCommissionDecryption(contractId: string): Promise<Decryption | null> {
    const query = `SELECT t.id, t.time_stamp, t.sender_public_key, p.param_value_string
      FROM
        txs_104 t
        JOIN txs_104_results r ON T.ID = r.tx_id
        JOIN txs_104_params p ON p.tx_id = T.ID
        WHERE t.contract_id = $1
          AND p.param_key = 'decryption'
          AND r.result_key = 'COMMISSION_DECRYPTION'
        ORDER BY index DESC LIMIT 1
    `
    const rawDecryptions = (await this.pg.query(query, [contractId])).rows
    return rawDecryptions.length ? this.mapDecryption(rawDecryptions[0]) : null
  }

  async getDecryptions(contractId: string): Promise<Decryption[]> {
    const query = `SELECT t.id, t.time_stamp, t.sender_public_key, p.param_value_string
      FROM
        txs_104 t
        JOIN txs_104_results r ON T.ID = r.tx_id
        JOIN txs_104_params p ON p.tx_id = T.ID
        JOIN
          (SELECT MAX(t.time_stamp) as "ts", t.sender_public_key as "s"
            FROM txs_104 t
            JOIN txs_104_params p ON t.id = p.tx_id
            WHERE t.contract_id = $1 AND p.param_value_string = 'decryption' GROUP BY t.sender_public_key) sq
          ON t.time_stamp = sq.ts AND t.sender_public_key = sq.s
        WHERE t.contract_id = $1
          AND p.param_key = 'decryption'
          AND r.result_key LIKE 'DECRYPTION_%'`

    const rawDecryptions = (await this.pg.query(query, [contractId])).rows
    return rawDecryptions.map(this.mapDecryption)
  }

  async getVotings(height: number): Promise<string[]> {
    const contractImage = this.configService.getContractImageHash()
    const contractName = this.configService.getContractName()

    const minDate = (new Date(Date.now() - this.configService.getMinDateStartInterval())).toISOString()
    const query = `
    SELECT c.id
    FROM
      txs_103 c
    JOIN txs_104 t ON c.id = t.contract_id
    JOIN txs_104_params p ON p.tx_id = t.id
    WHERE
      ${contractName ? 'c.contract_name = $1' : 'c.image_hash = $1'}
      AND c.height >= $2
      AND c.height <= (SELECT height FROM blocks ORDER BY height DESC LIMIT 1 OFFSET $3)
      AND p.param_key = 'dateStart'
      AND to_timestamp(p.param_value_string, 'DD-MM-YYYY HH24:MI:SS') > $4::TIMESTAMP
    `
    const result = (await this.pg.query(query, [contractName || contractImage, height, this.crawlerLag, minDate])).rows
    return result.map((row) => row.id)
  }

  private async getTransactions(contractId: string, height: number = 0): Promise<Transaction[]> {
    const query = `SELECT id, height, sender_public_key FROM txs_104
      WHERE contract_id = $1 AND height > $2 ORDER BY index ASC`
    return (await this.pg.query(query, [contractId, height])).rows
  }

  private async getTransactionParams(txId: string): Promise<TransactionParam[]> {
    const query = `SELECT param_key, param_type, param_value_string, param_value_integer FROM txs_104_params
      WHERE tx_id = $1`
    const result = (await this.pg.query(query, [txId])).rows

    return result.map((param) => {
      const type = `param_value_${param.param_type}`
      return {
        key: param.param_key,
        value: param[type],
      }
    })
  }

  async getLastRoundFor(ids: string[] = []): Promise<Array<{ contractId: string; round: number }>> {
    if (!ids.length) {
      return []
    }

    const query = `SELECT t.contract_id, MAX(p2.param_value_integer)
      FROM txs_104 t
        JOIN txs_104_params p1 ON p1.tx_id = t.id AND p1.param_value_string = 'updateServerList'
        JOIN txs_104_params p2 ON p2.tx_id = t.id AND p2.param_key = 'round'
        WHERE t.contract_id = ANY($1::varchar[])
        GROUP BY t.contract_id`

    const result = (await this.pg.query(query, [ids])).rows
    return result.map((row) => ({ contractId: row.contract_id, round: +row.max }))
  }

  async getWrongShadowPublicKeys(txIds: string[]): Promise<string[]> {
    if (!txIds.length) {
      return []
    }

    const query = `SELECT sender_public_key
      FROM txs_104
        WHERE id = ANY($1::varchar[])`

    const result = (await this.pg.query(query, [txIds])).rows
    return [...new Set(result.map((row) => row.sender_public_key))]
  }

  async getVotingInfo(contractId: string): Promise<VotingInfo | null> {
    const tx = (await this.getTransactions(contractId, 0)).shift()
    if (tx) {
      const raw = await this.getTransactionParams(tx.id)
      return {
        pollId: this.parseRawParams(raw, 'pollId'),
        contractId,
        dateStart: this.parseRawParams(raw, 'dateStart', 'date'),
        dateEnd: this.parseRawParams(raw, 'dateEnd', 'date'),
        k: this.parseRawParams(raw, 'k', 'number'),
        dimension: this.parseRawParams(raw, 'dimension', 'json'),
      }
    } else {
      return null
    }
  }

  async getVotingDateEnd(contractId: string) {
    const query = `SELECT (r.result_value_string::json->>'dateEnd') as "dateEnd" FROM txs_104 t
      JOIN txs_104_params p ON p.tx_id = t.id AND p.param_value_string = 'finishVoting'
      JOIN txs_104_results r ON t.id = r.tx_id
      WHERE t.contract_id = $1
      ORDER BY t.index DESC LIMIT 1`

    const result = (await this.pg.query(query, [contractId])).rows

    return result[0] && result[0].dateEnd && getDateFromStr(result[0].dateEnd) || null
  }

  private mapVote(raw: any): Vote {
    return {
      id: raw.id,
      ts: getDateFromStr(raw.time_stamp),
      height: raw.height,
      sender_public_key: raw.sender_public_key,
      vote: JSON.parse(raw.vote),
      blindSig: raw.blind_sig ? raw.blind_sig : undefined,
      mul: +raw.mul,
      processed: +raw.n,
    }
  }

  private mapDecryption(raw: any): Decryption {
    return {
      id: raw.id,
      ts: getDateFromStr(raw.time_stamp),
      sender_public_key: raw.sender_public_key,
      value: JSON.parse(raw.param_value_string),
    }
  }

  private parseRawParams(
    raw: any[],
    key: string,
    type: 'string' | 'number' | 'json' | 'date' = 'string',
  ) {
    const p = raw.find((param) => param.key === key)
    switch (type) {
      default:
        throw new Error('Unknown param type')
      case 'string':
        return p.value
      case 'number':
        return +p.value
      case 'date':
        return getIsoStringFromStr(p.value)
      case 'json':
        try {
          return JSON.parse(p.value)
        } catch (err) {
          throw new Error(err)
        }
    }
  }
}
