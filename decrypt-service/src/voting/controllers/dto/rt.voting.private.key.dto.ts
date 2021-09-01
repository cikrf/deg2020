import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RtVotingPrivateKeyDto {

  @ApiProperty({
    type: [String],
  })
  @IsString()
  decryptPrivKey: string

  @ApiProperty({
    type: [String],
    example: '4bdw5eWZg6twEoUeVepkhLDbEpsKTQMLsKALZ4sv8afi',
  })
  @IsString()
  decryptId: string

}
