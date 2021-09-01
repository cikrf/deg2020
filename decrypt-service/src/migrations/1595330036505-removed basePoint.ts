import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class removedBasePoint1595330036505 implements MigrationInterface {
  name = 'removedBasePoint1595330036505'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "base_point"`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ADD "base_point" json`)
  }
}
