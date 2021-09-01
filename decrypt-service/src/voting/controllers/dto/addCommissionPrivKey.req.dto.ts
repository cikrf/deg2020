import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class RtVotingAddCommissionPrivKeyRequestDTO {
  @ApiProperty({
    type: String,
    description: 'Commission private key',
    example: '12325822346107862275877093547995197879839878226127873615422428210574566462670',
  })

  @IsString()
  @IsNotEmpty()
  commissionPrivKey: string
}
