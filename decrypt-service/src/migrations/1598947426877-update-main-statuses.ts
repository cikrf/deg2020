import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMainStatuses1598947426877 implements MigrationInterface {
  name = 'UpdateMainStatuses1598947426877'

  public async up(queryRunner: QueryRunner): Promise<void> {
    //DEFAULT 'init'
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN status SET DEFAULT 'pollInitiated';`);
    await queryRunner.query(`UPDATE "main" SET status='pollInitiated' WHERE status='init'`)
    await queryRunner.query(`UPDATE "main" SET status='pollActive' WHERE status='created'`)
    await queryRunner.query(`UPDATE "main" SET status='pollFailed' WHERE status='failed'`)
    await queryRunner.query(`UPDATE "main" SET status='resultsFailed' WHERE status='error'`)
    await queryRunner.query(`UPDATE "main" SET status='resultsReady' WHERE status='finished'`)
    await queryRunner.query(`UPDATE "main" SET status='dkgCompleted' WHERE status='waitingForCommissionPubKey'`)
    await queryRunner.query(`UPDATE "main" SET status='waitingCommissionKey' WHERE status='waitingForCommissionPrivKey'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN status SET DEFAULT 'init';`);
    await queryRunner.query(`UPDATE "main" SET status='init' WHERE status='pollInitiated'`)
    await queryRunner.query(`UPDATE "main" SET status='created' WHERE status='pollActive'`)
    await queryRunner.query(`UPDATE "main" SET status='failed' WHERE status='pollFailed'`)
    await queryRunner.query(`UPDATE "main" SET status='error' WHERE status='resultsFailed'`)
    await queryRunner.query(`UPDATE "main" SET status='finished' WHERE status='resultsReady'`)
    await queryRunner.query(`UPDATE "main" SET status='waitingForCommissionPubKey' WHERE status='dkgCompleted'`)
    await queryRunner.query(`UPDATE "main" SET status='waitingForCommissionPrivKey' WHERE status='waitingCommissionKey'`)
  }

}
