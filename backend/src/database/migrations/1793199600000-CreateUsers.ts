import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1793199600000 implements MigrationInterface {
  name = 'CreateUsers1793199600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(150) NOT NULL, `institution` varchar(150) NULL, `cpf` varchar(11) NULL, `cnpj` varchar(14) NULL, `email` varchar(255) NOT NULL, `phone` varchar(11) NULL, `password` varchar(255) NOT NULL, `role` enum ('user', 'admin') NOT NULL DEFAULT 'user', `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX `UQ_users_email` (`email`), UNIQUE INDEX `UQ_users_cpf` (`cpf`), UNIQUE INDEX `UQ_users_cnpj` (`cnpj`), PRIMARY KEY (`id`)) ENGINE=InnoDB",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `users`');
  }
}
