import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartnerSupportCategory1793188800000 implements MigrationInterface {
  name = 'AddPartnerSupportCategory1793188800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `partners` MODIFY COLUMN `category` enum ('company', 'startup', 'educational_institution', 'government', 'other', 'support_entity') NOT NULL DEFAULT 'other'",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `partners` SET `category` = 'other' WHERE `category` = 'support_entity'",
    );
    await queryRunner.query(
      "ALTER TABLE `partners` MODIFY COLUMN `category` enum ('company', 'startup', 'educational_institution', 'government', 'other') NOT NULL DEFAULT 'other'",
    );
  }
}
