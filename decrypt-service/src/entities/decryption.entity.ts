import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Point } from '../crypto/interfaces'
import { Sums } from './sums.entity'

export enum DecryptionStatus {
  round = 'round',
  disabled = 'disabled',
  dkgCommit = 'dkgCommit',
  dkgScalar = 'dkgScalar',
  dkgShadows = 'dkgShadows',
  dkgComplaint = 'dkgComplaint',
  verified = 'verified',
  running = 'running',
  decrypted = 'decrypted',
  error = 'error',
  finished = 'finished',
}

export const DKG_PROCESS_STATUSES = [
  DecryptionStatus.dkgCommit,
  DecryptionStatus.dkgScalar,
  DecryptionStatus.dkgShadows,
]
export const DKG_FINAL_STATUSES = [
  DecryptionStatus.dkgComplaint,
  DecryptionStatus.disabled,
  DecryptionStatus.verified,
]
export const DECRYPT_ACTIONS_AFTER_END_STATUSES = [DecryptionStatus.running, DecryptionStatus.error]

@Entity('decryption')
export class Decryption {
  @PrimaryColumn({ name: 'contract_id' })
  contractId: string

  @Column({ name: 'poll_id', nullable: true, unique: true })
  pollId: string

  @Column({ name: 'status', enum: DecryptionStatus, default: DecryptionStatus.round })
  status: DecryptionStatus

  @Column({ name: 'public_key', type: 'json' })
  publicKey: Point

  @Column({ name: 'private_key' })
  privateKey: string

  @Column({ name: 'public_key_commit', type: 'json' })
  publicKeyCommit: Point

  @Column({ name: 'secret_key_of_commit' })
  secretKeyOfCommit: string

  @Column({ name: 'decrypted_shadows_sum', nullable: true })
  decryptedShadowsSum: string

  @Column({ name: 'main_key', type: 'json', nullable: true })
  mainKey: Point

  @Column({ name: 'round', default: 1 })
  round: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @Column({ name: 'date_start', type: 'timestamptz' })
  dateStart: Date

  @Column({ name: 'date_end', type: 'timestamptz', nullable: true })
  dateEnd: Date | null

  @Column({ name: 'dimension', type: 'json', default: [] })
  dimension: number[]

  @Column({ name: 'errors', default: 0 })
  errors: number = 0

  lock: boolean = false

  lockDate: Date = new Date(0)

  @OneToMany(
    (type) => Sums,
    (sums) => sums.decryption,
  )
  @JoinColumn({ name: 'contract_id' })
  sums: Promise<Sums[]>

  counted: boolean = false
  recounting: boolean = false
}
