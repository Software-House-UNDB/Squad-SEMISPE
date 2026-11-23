import * as bcrypt from 'bcrypt';
import dataSource from '../src/database/data-source';
import { Role, User } from '../src/users/entities/user.entity';

const EMAIL = 'admin.espacos@example.com';
const PASSWORD = 'EspacosTeste123!';

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'Este comando é exclusivo do ambiente local de desenvolvimento.',
    );
  }

  await dataSource.initialize();
  try {
    const repository = dataSource.getRepository(User);
    const existing = await repository.findOneBy({ email: EMAIL });

    if (existing) {
      if (
        existing.role !== Role.ADMIN ||
        !(await bcrypt.compare(PASSWORD, existing.password))
      ) {
        throw new Error(
          'O e-mail do exemplo já está em uso por outra conta. Nenhum usuário foi alterado.',
        );
      }
    } else {
      const user = repository.create({
        name: 'Administrador local de teste de espaços',
        email: EMAIL,
        password: await bcrypt.hash(PASSWORD, 10),
        role: Role.ADMIN,
      });
      await repository.save(user);
    }

    console.log(`Administrador local de teste disponível: ${EMAIL}`);
    console.log(
      'Use a senha do exemplo de espaços em api.md para fazer login.',
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
