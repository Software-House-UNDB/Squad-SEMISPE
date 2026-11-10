import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEcosystemActors1794323000000 implements MigrationInterface {
  name = 'CreateEcosystemActors1794323000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`ecosystem_actors\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(150) NOT NULL,
      \`category\` enum('startup','company','university','institution','innovation_environment','investor') NOT NULL,
      \`description\` text NOT NULL,
      \`websiteUrl\` varchar(2048) NULL,
      \`logoUrl\` varchar(2048) NULL,
      \`address\` varchar(255) NULL,
      \`city\` varchar(150) NULL,
      \`state\` varchar(2) NULL,
      \`latitude\` double NULL,
      \`longitude\` double NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`), INDEX \`IDX_ecosystem_actors_category_name\` (\`category\`, \`name\`)
    ) ENGINE=InnoDB`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `ecosystem_actors`');
  }
}
