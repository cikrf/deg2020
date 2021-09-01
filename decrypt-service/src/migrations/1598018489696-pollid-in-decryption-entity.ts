import {MigrationInterface, QueryRunner} from "typeorm";

export class pollidInDecryptionEntity1598018489696 implements MigrationInterface {
    name = 'pollidInDecryptionEntity1598018489696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decryption" ADD "poll_id" character varying`);
        await queryRunner.query(`ALTER TABLE "decryption" ADD CONSTRAINT "UQ_2a5e16b28b7101c8a957f19e280" UNIQUE ("poll_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decryption" DROP CONSTRAINT "UQ_2a5e16b28b7101c8a957f19e280"`);
        await queryRunner.query(`ALTER TABLE "decryption" DROP COLUMN "poll_id"`);
    }

}
