import { MigrationInterface, QueryRunner } from 'typeorm'

// tslint:disable-next-line:class-name
export class init1585679476653 implements MigrationInterface {
  name = 'init1585679476653'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "voting" (
        "id" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'new',
        "public_key" json NOT NULL,
        "private_key" character varying NOT NULL,
        "public_key_commit" json NOT NULL,
        "secret_key_of_commit" character varying NOT NULL,
        "date_start" TIMESTAMP NOT NULL, "date_end" TIMESTAMP NOT NULL,
        "k" integer NOT NULL,
        "n" integer NOT NULL,
        "round" integer NOT NULL DEFAULT 1,
        "polynomial" json NOT NULL,
        "height" integer NOT NULL DEFAULT 0,
        "servers" json NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_2dff1e5c53fa2cc610bea30476c"
        PRIMARY KEY ("id")
      )`,
      undefined,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "voting"`, undefined)
  }
}
