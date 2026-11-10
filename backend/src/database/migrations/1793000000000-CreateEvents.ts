import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvents1793000000000 implements MigrationInterface {
  name = 'CreateEvents1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`events\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`type\` enum ('hackathon', 'workshop', 'course', 'other') NOT NULL DEFAULT 'other', \`description\` text NOT NULL, \`location\` varchar(255) NOT NULL, \`startsAt\` datetime NOT NULL, \`endsAt\` datetime NULL, \`schedule\` json NOT NULL, \`speakers\` json NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`event_registrations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`eventId\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(30) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_event_registrations_event_email\` (\`eventId\`, \`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`event_registrations\` ADD CONSTRAINT \`FK_event_registrations_event\` FOREIGN KEY (\`eventId\`) REFERENCES \`events\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`event_registrations\` DROP FOREIGN KEY \`FK_event_registrations_event\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_event_registrations_event_email\` ON \`event_registrations\``,
    );
    await queryRunner.query(`DROP TABLE \`event_registrations\``);
    await queryRunner.query(`DROP TABLE \`events\``);
  }
}
