import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RtVotingPutResponseDTO {
  @ApiProperty({
    type: String,
    example: 'completed',
  })
  @IsString()
  result: string
}
