import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartners1792711984546 implements MigrationInterface {
  name = 'CreatePartners1792711984546';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`partners\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`category\` enum ('company', 'startup', 'educational_institution', 'government', 'other') NOT NULL DEFAULT 'other', \`description\` text NOT NULL, \`logoUrl\` varchar(255) NULL, \`shortDescription\` varchar(150) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_6b39bc13ab676e74eada2e744d\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_6b39bc13ab676e74eada2e744d\` ON \`partners\``,
    );
    await queryRunner.query(`DROP TABLE \`partners\``);
  }
}
