import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class decryptedShadowsSum1586359774642 implements MigrationInterface {
  name = 'decryptedShadowsSum1586359774642'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "voting" ADD "decrypted_shadows_sum" character varying`,
      undefined,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "voting" DROP COLUMN "decrypted_shadows_sum"`, undefined)
  }
}
