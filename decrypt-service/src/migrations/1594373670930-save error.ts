import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class saveError1594373670930 implements MigrationInterface {
  name = 'saveError1594373670930'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ADD "error" character varying`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" SET DEFAULT null`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "dimension" SET DEFAULT '[]'`)
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "dimension" SET DEFAULT '[]'`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "dimension" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "dimension" SET DEFAULT '{}'`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "date_end" DROP DEFAULT`)
    await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "error"`)
  }
}
