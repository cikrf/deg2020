import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('blocks')
export class Block {
  @PrimaryColumn({ name: 'height' })
  height: number

  @Column({ name: 'signature' })
  signature: string
}
