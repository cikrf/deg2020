import {MigrationInterface, QueryRunner} from "typeorm";

export class commissionPubKey1597997275989 implements MigrationInterface {
    name = 'commissionPubKey1597997275989'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" ADD "commission_public_key" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "commission_public_key"`);
    }

}
