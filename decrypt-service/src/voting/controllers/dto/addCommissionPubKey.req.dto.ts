import { ApiProperty } from '@nestjs/swagger'
import {
  IsHexadecimal,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class PointObj {
  @IsNotEmpty()
  @IsHexadecimal()
  x: string

  @IsNotEmpty()
  @IsHexadecimal()
  y: string
}

export class RtVotingAddCommissionPubKeyRequestDTO {
  @ApiProperty({
    type: Object,
    description: 'Commission public key',
    properties: {
      x: { type: 'string' },
      y: { type: 'string' },
    },
    example: {
      x: 'c21514668fabd65e2f0de6b0e0b4e17e8d13402738c8ea3b7fdc30e56b16eb69',
      y: 'ce4c94ce9d6afe9aa52d0a0bb7dfe23a1896ca0c32489b042de82070effa9215',
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => PointObj)
  commissionPubKey: PointObj

}
