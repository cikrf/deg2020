import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Point, PointObj } from '../crypto/interfaces'
import { Sums } from './sums.entity'

export enum MainType {
  common = 'common',
  blind = 'blind',
}

export enum MainStatus {
  pollInitiated = 'pollInitiated',
  pollStarted = 'pollStarted',
  pollFailed = 'pollFailed',
  dkgCompleted = 'dkgCompleted',
  mainKeySent = 'mainKeySent',
  pollActive = 'pollActive',
  pollHalted = 'pollHalted',
  pollCompleted = 'pollCompleted',
  waitingCommissionKey = 'waitingCommissionKey',
  prepareResults = 'prepareResults',
  resultsReady = 'resultsReady',
  resultsFailed = 'resultsFailed',
}

@Entity('main')
export class Main {
  @PrimaryColumn({ name: 'contract_id' })
  contractId: string

  @Column({ name: 'poll_id', nullable: true, unique: true })
  pollId: string

  @Column({ name: 'type', enum: MainType, default: MainType.common })
  type: string

  @Column({ name: 'error', nullable: true })
  error: string

  @Column({ name: 'status', enum: MainStatus, default: MainStatus.pollInitiated })
  status: MainStatus

  @Column({ name: 'date_start', type: 'timestamptz' })
  dateStart: Date

  @Column({ name: 'date_end', type: 'timestamptz', nullable: true })
  dateEnd: Date | null

  @Column({ name: 'dimension', type: 'json', default: [] })
  dimension: number[]

  @Column({ name: 'result', type: 'json', nullable: true })
  result: number[][]

  @Column({ name: 'decrypt_key', type: 'json', nullable: true })
  decryptKey: Point

  @Column({ name: 'commission_public_key', type: 'json', nullable: true })
  commissionPubKey: PointObj

  @Column({ name: 'blind_signature_modulo', default: '' })
  blindSigModulo: string

  @Column({ name: 'blind_signature_exponent', default: '' })
  blindSigExponent: string

  @Column({ name: 'participants', type: 'json', nullable: true })
  participants: string[]

  @Column({ name: 'admins', type: 'json', nullable: true })
  admins: string[]

  @Column({ name: 'errors', default: 0 })
  errors: number = 0

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany((type) => Sums, (sums) => sums.main)
  @JoinColumn({ name: 'contract_id' })
  sums: Promise<Sums[]>

  lock: boolean = false
  lockDate: Date = new Date(0)
}
