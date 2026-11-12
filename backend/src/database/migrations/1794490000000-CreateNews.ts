import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNews1794490000000 implements MigrationInterface {
  name = 'CreateNews1794490000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`news\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`title\` varchar(200) NOT NULL,
      \`slug\` varchar(200) NOT NULL,
      \`summary\` varchar(500) NOT NULL,
      \`content\` mediumtext NOT NULL,
      \`category\` enum('innovation','startups','technology_park','ecosystem','notices') NOT NULL,
      \`imageUrl\` varchar(2048) NULL,
      \`imageAlt\` varchar(300) NULL,
      \`status\` enum('draft','published') NOT NULL DEFAULT 'draft',
      \`publishedAt\` datetime(6) NULL,
      \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`), UNIQUE INDEX \`UQ_news_slug\` (\`slug\`),
      INDEX \`IDX_news_publication\` (\`status\`, \`publishedAt\`, \`id\`)
    ) ENGINE=InnoDB`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `news`');
  }
}
