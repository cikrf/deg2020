import { MigrationInterface, QueryRunner } from 'typeorm'

export class mainkeyInDecryption1599062114444 implements MigrationInterface {
    name = 'mainkeyInDecryption1599062114444'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decryption" ADD "main_key" json`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "decryption" DROP COLUMN "main_key"`)
    }

}
