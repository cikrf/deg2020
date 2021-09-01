import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class splitEntities1594135464033 implements MigrationInterface {
  name = 'splitEntities1594135464033'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('voting', 'decryption')
    await queryRunner.renameColumn('decryption', 'id', 'contract_id')
    await queryRunner.query(`ALTER TABLE "decryption" DROP COLUMN "k"`)
    await queryRunner.query(`ALTER TABLE "decryption" DROP COLUMN "height"`)
    await queryRunner.query(`ALTER TABLE "decryption" DROP COLUMN "result"`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "status" SET DEFAULT 'round'`)
    await queryRunner.query(
      `CREATE TABLE "main" (
        "contract_id" character varying NOT NULL,
        "type" character varying NOT NULL DEFAULT 'standard',
        "status" character varying NOT NULL DEFAULT 'init',
        "date_start" TIMESTAMP WITH TIME ZONE NOT NULL,
        "date_end" TIMESTAMP WITH TIME ZONE, "dimension" json NOT NULL,
        "result" json,
        "blind_signature" json,
        "participants" json,
        "admins" json,
        "errors" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_f223282a7a2b090e670e2fa58ef"
        PRIMARY KEY ("contract_id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "sums" (
        "contract_id" character varying NOT NULL,
        "index" SERIAL NOT NULL,
        "height" integer NOT NULL DEFAULT 0,
        "votes" integer NOT NULL DEFAULT 0,
        "voted" json NOT NULL DEFAULT '[]',
        "a" json NOT NULL DEFAULT '[]',
        "b" json NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3b01caf74ee83e41f26519ee404"
        PRIMARY KEY ("contract_id", "index"))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "main"`)
    await queryRunner.query(`DROP TABLE "sums"`)
    await queryRunner.query(`ALTER TABLE "decryption" ALTER COLUMN "status" SET DEFAULT 'new'`)
    await queryRunner.query(`ALTER TABLE "decryption" ADD COLUMN "k" integer NOT NULL DEFAULT 0`)
    await queryRunner.query(
      `ALTER TABLE "decryption" ADD COLUMN "height" integer NOT NULL DEFAULT 0`,
    )
    await queryRunner.query(`ALTER TABLE "decryption" ADD COLUMN "result" json`)
    await queryRunner.renameColumn('decryption', 'contract_id', 'id')
    await queryRunner.renameTable('decryption', 'voting')
  }
}
