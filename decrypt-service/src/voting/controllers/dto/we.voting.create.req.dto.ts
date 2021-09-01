import { ApiProperty } from '@nestjs/swagger'
import { ArrayNotEmpty, Equals, IsArray, IsInt, IsString, Min, MinLength } from 'class-validator'

export class WeVotingCreateRequestDTO {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @MinLength(1)
  pollId: string

  @ApiProperty({ example: 'common' })
  @IsString()
  @Equals('common')
  type: 'common'

  @ApiProperty({ required: false, example: 'Poll #1' })
  @IsString()
  title: string

  @ApiProperty({ required: false, example: 'Poll about serious questions' })
  @IsString()
  description: string

  @ApiProperty({ required: false, example: '134f135f1vg25g15g135g13' })
  @IsString()
  companyId: string

  @ApiProperty({
    type: [Object],
    required: false,
    example: [
      {
        title: '1.pdf',
        dateUpload: new Date(),
        hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      },
    ],
  })
  @IsArray()
  docs: object[]

  @ApiProperty({ example: '5ec3f6a79frgwqgrgeetqgd339d4d135f3dba' })
  @IsString()
  @MinLength(1)
  bulletinHash: string

  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  dimension: number[]

  @ApiProperty({ example: Date.now() + 5 * 60000 })
  @IsInt()
  dateStart: number

  @ApiProperty({ example: Date.now() + 6 * 60000 })
  @IsInt()
  dateEnd: number

  @ApiProperty({
    required: false,
    type: [String],
    description: 'List of participant`s public keys for common voting',
    example: [
      'DvW58DHmpTs3bLHDRRccUxHrvy1D2PA2Ua44ryTaByvU',
      'GffGPALxJ7tmLYbbbfKTztmMRmBj38cG45S8A3D8xV5A',
    ],
  })
  @IsArray()
  participants: string[]

  @ApiProperty({
    required: false,
    type: [String],
    description: 'List of admin`s public keys for common voting',
    example: [
      'DvW58DHmpTs3bLHDRRccUxHrvy1D2PA2Ua44ryTaByvU',
      'GffGPALxJ7tmLYbbbfKTztmMRmBj38cG45S8A3D8xV5A',
    ],
  })
  @IsArray()
  admins: string[]
}
