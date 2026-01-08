import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767904931266 implements MigrationInterface {
    name = 'InitialSchema1767904931266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    }

}
