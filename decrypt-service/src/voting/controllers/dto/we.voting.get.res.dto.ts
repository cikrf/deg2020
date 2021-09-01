import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsNumber, IsString } from 'class-validator'

export class WeVotingGetResponseDTO {
  @ApiProperty({
    type: String,
    example: 'active | halted | completed',
  })
  status: string

  @ApiProperty({
    type: String,
    example: 'blind',
  })
  type: string

  @ApiProperty({ example: '5ec3f6a79frgwqgrgeetqgd339d4d135f3dba' })
  @IsString()
  bulletinHash: string

  @ApiProperty({ example: [3, 2, 1] })
  @IsString()
  dimension: string

  @ApiProperty({ example: 1564111260340 })
  @IsNumber()
  dateStart: number

  @ApiProperty({ required: false, example: 1564111260340 })
  @IsNumber()
  dateEnd: number

  @ApiProperty({ example: 6 })
  @IsNumber()
  minDecryptAmount: number

  @ApiProperty({ example: 8 })
  @IsNumber()
  totalDecryptAmount: number

  @ApiProperty({ example: 2 })
  @IsNumber()
  dkgRound: number

  @ApiProperty({
    type: [String],
    example: [
      '55066263022277343669578718895168534326250603453777594175500187360389116729240',
      '32670510020758816978083085130507043184471273380659243275938904335757337482424',
    ],
  })
  @IsArray()
  mainKey: string[]

  @ApiProperty({ example: 50 })
  @IsNumber()
  votesUnique: number

  @ApiProperty({ example: 200 })
  @IsNumber()
  votesAll: number

  // @ApiProperty({ example: 1000100 })
  // @IsNumber()
  // voters: number

  @ApiProperty({ type: [Number], example: [8, 0, 3] })
  @IsArray()
  results: number

  // @ApiProperty({ example: 'f234f8174fh71o48fho147fho1943hfo134fh' })
  // @IsString()
  // txId: string

  @ApiProperty({ required: false, example: 0 })
  @IsNumber()
  errorCode: string

  @ApiProperty({ required: false, example: 'Poll does not exist' })
  @IsString()
  errorMsg: string

  @ApiProperty({ example: 'f234f8174fh71o48fho147fho1943hfo134fh' })
  @IsString()
  txId: string
}
