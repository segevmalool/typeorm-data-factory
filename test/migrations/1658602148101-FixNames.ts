import { MigrationInterface, QueryRunner } from "typeorm"

export class FixNames1658602148101 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            alter table users rename column "firstname" to "firstName";
            alter table users rename column "lastname" to "lastName";
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            alter table users rename column "firstName" to "firstname";
            alter table users rename column "lastName" to "lastname";
        `);
    }

}
