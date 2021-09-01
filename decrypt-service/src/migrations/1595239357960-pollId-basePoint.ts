import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class pollIdBasePoint1595239357960 implements MigrationInterface {
  name = 'pollIdBasePoint1595239357960'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ADD "poll_id" character varying`)
    await queryRunner.query(
      `ALTER TABLE "main" ADD CONSTRAINT "UQ_68401a776959f31314adb55199f" UNIQUE ("poll_id")`,
    )
    await queryRunner.query(`ALTER TABLE "main" ADD "base_point" json`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "base_point"`)
    await queryRunner.query(`ALTER TABLE "main" DROP CONSTRAINT "UQ_68401a776959f31314adb55199f"`)
    await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "poll_id"`)
  }
}
