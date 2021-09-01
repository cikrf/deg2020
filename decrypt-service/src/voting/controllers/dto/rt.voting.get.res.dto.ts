import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsHexadecimal, IsNumber, IsString } from 'class-validator'
import { Point } from '../../../crypto/interfaces'

export class RtVotingGetResponseDTO {
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

  @ApiProperty({
    type: String,
    description: 'Blind signature modulo',
    example: '82ea9f2670d52fa85b26571e8d8cab37df1e4412277cb79ae1c15b4f14330370a3e8fd3ce2637c6eecce33580eaac71054e99dd76c787283143227c96263f740670674a89054067e77c85ac6d2133378e1aecf63ec62a392f79459a19f8837b685e420ee7dcf06b051f8f3e4aa5f4dddff03042322d1088124cee85c5152f48e58fabda5c33acb20d34d225d433075434290562e0b522ba940249ee1ea366bf06ceacd01090adefee54ed19e37a87679cfbd779047105f23fd27e27f8727d6472f2e889e86c2e9ec525919ea550f51f0a6eef8a4df9d604755bd2510a46a337bfa692c690d2a9b5964adf0044b34275e2e8d9739643031730cbbe384e763977d15fc9a8dc7aa45c6592d998d0afc9ff3efe7a756c545dbe5976c9740ee8080933333006153af7e6ec6a3d74ecee4c31774c438a45cd188182cd29a6976f2f024ab779f14fdff688ac2ccc6a268fc1b2ca86f283c8fdfd5bed297158bc7c5ecd553735f81212a29a21a71eea92cf73c7e02925bc1725d6d24be2771d95c115197',
  })
  @IsHexadecimal()
  @IsString()
  blindSigModulo: string

  @ApiProperty({
    type: String,
    description: 'Blind signature exponent',
    example: '10001',
  })
  @IsString()
  @IsHexadecimal()
  blindSigExponent: string
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
  mainKey: Point

  @ApiProperty({ example: 50 })
  @IsNumber()
  votesFail: number

  @ApiProperty({ example: 50 })
  @IsNumber()
  votesSuccess: number

  @ApiProperty({ example: 50 })
  @IsNumber()
  votesUnique: number

  @ApiProperty({ example: 200 })
  @IsNumber()
  votesAll: number

  @ApiProperty({ type: [Number], example: [8, 0, 3] })
  @IsArray()
  results: number

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
