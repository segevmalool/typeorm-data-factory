import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorityTable1658959548749 implements MigrationInterface {
    name = 'AddAuthorityTable1658959548749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            create table if not exists authorities (
                id uuid primary key default gen_random_uuid(),
                "userId" uuid references users(id),
                "transferId" uuid unique references transfers(id)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.query(`
            drop table if exists authorities;
        `);
    }

}
