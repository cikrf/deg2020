import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class dimensionsAndResultRemovedPolynomial1592397090341 implements MigrationInterface {
  name = 'dimensionsAndResult,RemovedPolynomial1592397090341'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "polynomial"`)
    await queryRunner.query(`ALTER TABLE "voting" ADD "dimension" json NOT NULL DEFAULT '{}'`)
    await queryRunner.query(`ALTER TABLE "voting" ADD "result" json NOT NULL DEFAULT '{}'`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "result"`)
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "dimension"`)
    await queryRunner.query(`ALTER TABLE "voting" ADD "polynomial" json NOT NULL`)
  }
}
