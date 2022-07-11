import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionColumns1657465038959 implements MigrationInterface {
    name = 'AddTransactionColumns1657465038959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD "amount" numeric NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "fromUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD "toUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_ccbdb7637f348c5d146b5c6c3b3" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_92c3201a4b4dc707b5d13d3fcf7" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_92c3201a4b4dc707b5d13d3fcf7"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_ccbdb7637f348c5d146b5c6c3b3"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "toUserId"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "fromUserId"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "amount"`);
    }

}
