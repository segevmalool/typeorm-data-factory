import { MigrationInterface, QueryRunner } from "typeorm"

export class RenameTransactionTable1658600882994 implements MigrationInterface {
    name = 'RenameTransactionTable1658600882994';

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            alter table transactions rename to transfers;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            alter table transfers rename to transactions;
        `);
    }

}
