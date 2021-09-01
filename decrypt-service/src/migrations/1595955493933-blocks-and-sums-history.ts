import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class blocksAndSumsHistory1595955493933 implements MigrationInterface {
  name = 'blocksAndSumsHistory1595955493933'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blocks" (
        "height" integer NOT NULL,
        "signature" character varying NOT NULL,
        CONSTRAINT "PK_50fcf07511f97f0c50f28fa26d2" PRIMARY KEY ("height")
      )`,
    )
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "type" SET DEFAULT 'common'`)
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "date_end" DROP DEFAULT`)
    await queryRunner.query(
      `ALTER TABLE "decryption" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01'`,
    )

    await queryRunner.query(`ALTER TABLE "sums" ADD "decryptionContractId" character varying`)
    await queryRunner.query(`ALTER TABLE "sums" ADD "mainContractId" character varying`)
    await queryRunner.query(
      `ALTER TABLE "sums" ADD
        CONSTRAINT "FK_e43d16e71d54b8b1d6fb2b28cfd"
        FOREIGN KEY ("decryptionContractId")
        REFERENCES "decryption"("contract_id")
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "sums" ADD
        CONSTRAINT "FK_94d6074e7b2df7b363c7ce04b6b"
        FOREIGN KEY ("mainContractId")
        REFERENCES "main"("contract_id")
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )

    // tslint:disable-next-line:max-line-length
    // const votings = await queryRunner.query(`SELECT d.contract_id, d.dimension FROM decryption d LEFT JOIN sums s ON d.contract_id = s.contract_id WHERE s IS NULL`)
    // await Promise.all(votings.map(async (voting: any) => {
    //   await queryRunner.query(`INSERT INTO sums (contract_id, votes, voted, a, b) VALUES ($1, $2, $3, $4, $5)`, [
    //     voting.contract_id,
    //     0,
    //     JSON.stringify(Array(voting.dimension.length).fill(0)),
    //     JSON.stringify(voting.dimension.map((optionsNum: number) => Array(optionsNum).fill([0, 1]))),
    //     JSON.stringify(voting.dimension.map((optionsNum: number) => Array(optionsNum).fill([0, 1])))
    //   ])
    // }))
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "decryption" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01 00:00:00+03'`,
    )
    await queryRunner.query(
      `ALTER TABLE "main" ALTER COLUMN "date_end" SET DEFAULT '2099-01-01 00:00:00+03'`,
    )
    await queryRunner.query(`ALTER TABLE "main" ALTER COLUMN "type" SET DEFAULT 'standard'`)
    await queryRunner.query(`DROP TABLE "blocks"`)

    await queryRunner.query(`ALTER TABLE "sums" DROP CONSTRAINT "FK_94d6074e7b2df7b363c7ce04b6b"`)
    await queryRunner.query(`ALTER TABLE "sums" DROP CONSTRAINT "FK_e43d16e71d54b8b1d6fb2b28cfd"`)
    await queryRunner.query(`ALTER TABLE "sums" DROP COLUMN "mainContractId"`)
    await queryRunner.query(`ALTER TABLE "sums" DROP COLUMN "decryptionContractId"`)
  }
}
