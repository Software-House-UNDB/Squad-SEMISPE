import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkReservationUser1794931200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE reservations ADD userId int NULL');
    await queryRunner.query(
      'ALTER TABLE reservations ADD CONSTRAINT FK_reservations_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL',
    );
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE reservations DROP FOREIGN KEY FK_reservations_user',
    );
    await queryRunner.query('ALTER TABLE reservations DROP COLUMN userId');
  }
}
