import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class invalidCounter1597408908669 implements MigrationInterface {
  name = 'invalidCounter1597408908669'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sums" ADD "invalid" integer NOT NULL DEFAULT 0`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sums" DROP COLUMN "invalid"`)
  }

}
