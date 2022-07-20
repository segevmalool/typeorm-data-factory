import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RefineName1658278896629 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            alter table users rename column name to firstName;
            alter table users add column lastName text default 'PLACEHOLDER';
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            alter table users rename column firstName to name;
            alter table users drop column lastName;
        `)
    }

}
