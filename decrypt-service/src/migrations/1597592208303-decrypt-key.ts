import {MigrationInterface, QueryRunner} from "typeorm";

export class decryptKey1597592208303 implements MigrationInterface {
    name = 'decryptKey1597592208303'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" ADD "decrypt_key" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "decrypt_key"`);
    }

}
