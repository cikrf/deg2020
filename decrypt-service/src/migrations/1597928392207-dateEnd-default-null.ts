import { MigrationInterface, QueryRunner } from 'typeorm'

export class DateEndDefaultNull1597928392207 implements MigrationInterface {
  name = 'dateEndDefaultNull1597928392207'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" DROP NOT NULL`)
    await queryRunner.query(`UPDATE "decryption" SET date_end=NULL WHERE date_end='2099-01-01'::TIMESTAMP`)
    await queryRunner.query(`UPDATE "main" SET date_end=NULL WHERE date_end='2099-01-01'::TIMESTAMP`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" SET NOT NULL'`)
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01'`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01'`)
    await queryRunner.query(`UPDATE "decryption" SET date_end='2099-01-01' WHERE "date_end" is NULL`)
    await queryRunner.query(`UPDATE "main" SET date_end='2099-01-01' WHERE "date_end" is NULL`)
  }
}
