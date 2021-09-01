import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class dateEndDefaultFix1594387568152 implements MigrationInterface {
  name = 'dateEndDefaultFix1594387568152'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01'`)
    await queryRunner.query(
      `ALTER TABLE "decryption" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01'`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" DROP DEFAULT`)
  }
}
