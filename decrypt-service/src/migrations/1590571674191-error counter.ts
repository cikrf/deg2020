import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class errorCounter1590571674191 implements MigrationInterface {
  name = 'errorCounter1590571674191'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" ADD "errors" integer NOT NULL DEFAULT 0`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "errors"`)
  }
}
