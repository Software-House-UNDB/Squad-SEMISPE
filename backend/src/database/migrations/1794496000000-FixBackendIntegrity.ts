import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixBackendIntegrity1794496000000 implements MigrationInterface {
  name = 'FixBackendIntegrity1794496000000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE `users` ADD `tokenVersion` int NOT NULL DEFAULT 0',
    );
    await runner.query(
      'ALTER TABLE `ideas` DROP FOREIGN KEY `FK_e4ef6f47b5b94dff28757a88f37`',
    );
    await runner.query(
      'ALTER TABLE `ideas` ADD CONSTRAINT `FK_e4ef6f47b5b94dff28757a88f37` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE NO ACTION',
    );
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query(
      'ALTER TABLE `ideas` DROP FOREIGN KEY `FK_e4ef6f47b5b94dff28757a88f37`',
    );
    await runner.query(
      'ALTER TABLE `ideas` ADD CONSTRAINT `FK_e4ef6f47b5b94dff28757a88f37` FOREIGN KEY (`authorId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await runner.query('ALTER TABLE `users` DROP COLUMN `tokenVersion`');
  }
}
