import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString } from 'class-validator'

export class VotingCreateResponseDTO {
  @ApiProperty({ example: '134f135f1vg25g15g135g13' })
  @IsString()
  pollId: string

  @ApiProperty({ example: 'f234f8174fh71o48fho147fho1943hfo134fh' })
  @IsString()
  txId: string

  @ApiProperty({ required: false, example: 'Poll request failed' })
  @IsString()
  errorMsg: string

  @ApiProperty({ required: false, example: 0 })
  @IsNumber()
  errorCode: number
}
