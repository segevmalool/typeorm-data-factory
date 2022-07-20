import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RefineName1658278896629 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        queryRunner.renameColumn("users", "name", "firstName");
        queryRunner.addColumn("users", new TableColumn({
            name: "lastName",
            type: "text",
            default: "PLACEHOLDER"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        queryRunner.renameColumn("users", "firstName", "name");
        queryRunner.dropColumn("users", "lastName");
    }

}
