import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdeas1794282716408 implements MigrationInterface {
  name = 'CreateIdeas1794282716408';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`ideas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(150) NOT NULL, \`category\` enum ('health', 'education', 'mobility', 'environment', 'tourism', 'culture', 'security', 'technology', 'smart_city', 'digital_government', 'other') NOT NULL, \`problem\` text NOT NULL, \`solution\` text NOT NULL, \`expectedBenefits\` text NOT NULL, \`targetAudience\` varchar(255) NOT NULL, \`applicationArea\` varchar(255) NOT NULL, \`status\` enum ('submitted', 'evaluation', 'under_analysis', 'approved', 'forwarded', 'implemented') NOT NULL DEFAULT 'submitted', \`authorId\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ideas\` ADD CONSTRAINT \`FK_e4ef6f47b5b94dff28757a88f37\` FOREIGN KEY (\`authorId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`ideas\` DROP FOREIGN KEY \`FK_e4ef6f47b5b94dff28757a88f37\``,
    );
    await queryRunner.query(`DROP TABLE \`ideas\``);
  }
}
