import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class removedServersAndOther1586081468229 implements MigrationInterface {
  name = 'removedServersAndOther1586081468229'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "n"`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "servers"`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "date_start"`, undefined)
    await queryRunner.query(
      `ALTER TABLE "voting" ADD "date_start" TIMESTAMP WITH TIME ZONE NOT NULL`,
      undefined,
    )
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "date_end"`, undefined)
    await queryRunner.query(
      `ALTER TABLE "voting" ADD "date_end" TIMESTAMP WITH TIME ZONE NOT NULL`,
      undefined,
    )
    await queryRunner.query(`ALTER TABLE "voting" ALTER COLUMN "height" DROP DEFAULT`, undefined)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" ALTER COLUMN "height" SET DEFAULT 0`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "date_end"`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" ADD "date_end" TIMESTAMP NOT NULL`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "date_start"`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" ADD "date_start" TIMESTAMP NOT NULL`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" ADD "servers" json NOT NULL`, undefined)
    await queryRunner.query(`ALTER TABLE "voting" ADD "n" integer NOT NULL`, undefined)
  }
}
