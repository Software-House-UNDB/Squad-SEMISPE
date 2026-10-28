import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpaceState1793188800001 implements MigrationInterface {
  name = 'AddSpaceState1793188800001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `spaces` ADD COLUMN `state` enum ('active', 'inactive') NOT NULL DEFAULT 'active'",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `spaces` DROP COLUMN `state`');
  }
}
