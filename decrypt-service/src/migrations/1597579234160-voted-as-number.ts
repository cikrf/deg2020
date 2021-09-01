import {MigrationInterface, QueryRunner} from "typeorm";

export class votedAsNumber1597579234160 implements MigrationInterface {
    name = 'votedAsNumber1597579234160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sums" DROP CONSTRAINT "PK_3b01caf74ee83e41f26519ee404"`);
        await queryRunner.query(`ALTER TABLE "sums" ADD CONSTRAINT "PK_f9ec7222d961ce1c591347d5d58" PRIMARY KEY ("index")`);
        await queryRunner.query(`ALTER TABLE "sums" DROP COLUMN "voted"`);
        await queryRunner.query(`ALTER TABLE "sums" ADD "voted" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sums" DROP COLUMN "voted"`);
        await queryRunner.query(`ALTER TABLE "sums" ADD "voted" json NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "sums" DROP CONSTRAINT "PK_f9ec7222d961ce1c591347d5d58"`);
        await queryRunner.query(`ALTER TABLE "sums" ADD CONSTRAINT "PK_3b01caf74ee83e41f26519ee404" PRIMARY KEY ("contract_id", "index")`);
    }

}
