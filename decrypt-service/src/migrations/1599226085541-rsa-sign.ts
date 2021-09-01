import { MigrationInterface, QueryRunner } from 'typeorm'

export class rsaSign1599226085541 implements MigrationInterface {
    name = 'rsaSign1599226085541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "blind_signature"`)
        await queryRunner.query(`ALTER TABLE "main" ADD "blind_signature_modulo" character varying NOT NULL DEFAULT ''`)
        await queryRunner.query(`ALTER TABLE "main" ADD "blind_signature_exponent" character varying NOT NULL DEFAULT ''`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "blind_signature_exponent"`)
        await queryRunner.query(`ALTER TABLE "main" DROP COLUMN "blind_signature_modulo"`)
        await queryRunner.query(`ALTER TABLE "main" ADD "blind_signature" json`)
    }

}
