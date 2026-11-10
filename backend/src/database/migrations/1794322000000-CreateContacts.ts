import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContacts1794322000000 implements MigrationInterface {
  name = 'CreateContacts1794322000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`contacts\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(150) NOT NULL,
      \`email\` varchar(254) NOT NULL,
      \`subject\` varchar(150) NOT NULL,
      \`message\` text NOT NULL,
      \`status\` enum('new','read','closed') NOT NULL DEFAULT 'new',
      \`notificationStatus\` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
      \`notificationAttempts\` int NOT NULL DEFAULT 0,
      \`notifiedAt\` datetime NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      INDEX \`IDX_contacts_created\` (\`createdAt\`, \`id\`)
    ) ENGINE=InnoDB`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `contacts`');
  }
}
