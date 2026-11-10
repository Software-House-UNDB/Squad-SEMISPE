import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservations1794300000000 implements MigrationInterface {
  name = 'CreateReservations1794300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`reservations\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`spaceId\` int NOT NULL,
      \`requester\` json NOT NULL,
      \`date\` date NOT NULL,
      \`startTime\` time NOT NULL,
      \`endTime\` time NOT NULL,
      \`participants\` int NOT NULL,
      \`eventType\` varchar(150) NOT NULL,
      \`equipment\` json NOT NULL,
      \`needsItSupport\` tinyint NOT NULL DEFAULT 0,
      \`subject\` text NOT NULL,
      \`consent\` tinyint NOT NULL,
      \`status\` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
      \`reviewNote\` text NULL,
      \`reviewedBy\` int NULL,
      \`reviewedAt\` datetime NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      INDEX \`IDX_reservations_schedule\` (\`spaceId\`, \`date\`, \`status\`, \`startTime\`),
      CONSTRAINT \`FK_reservations_space\` FOREIGN KEY (\`spaceId\`) REFERENCES \`spaces\` (\`id\`) ON DELETE RESTRICT
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`reservation_attachments\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`reservationId\` int NOT NULL,
      \`kind\` enum('oficio','projeto','apresentacao','pauta') NOT NULL,
      \`originalName\` varchar(255) NOT NULL,
      \`mimeType\` varchar(100) NOT NULL,
      \`size\` int NOT NULL,
      \`content\` longblob NOT NULL,
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`FK_reservation_attachments_reservation\` FOREIGN KEY (\`reservationId\`) REFERENCES \`reservations\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `reservation_attachments`');
    await queryRunner.query('DROP TABLE `reservations`');
  }
}
