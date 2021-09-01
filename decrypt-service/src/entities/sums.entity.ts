import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Point } from '../crypto/interfaces'
import { Decryption } from './decryption.entity'
import { Main } from './main.entity'

@Entity('sums')
export class Sums {
  @PrimaryGeneratedColumn()
  index: number

  @Column({ name: 'contract_id' })
  contractId: string

  @Column({ name: 'height', default: 0 })
  height: number

  @Column({ name: 'votes', default: 0 })
  votes: number

  @Column({ name: 'invalid',  default: 0 })
  invalid: number

  @Column({ name: 'voted', default: 0 })
  voted: number

  @Column({ name: 'a', type: 'json', default: [] })
  A: Point[][]

  @Column({ name: 'b', type: 'json', default: [] })
  B: Point[][]

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne((type) => Decryption)
  decryption: Decryption

  @ManyToOne((type) => Main)
  main: Main
}
