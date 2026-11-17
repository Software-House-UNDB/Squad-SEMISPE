import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Space, SpaceState } from '../src/spaces/entities/space.entity';

/** Catálogo inicial do site oficial. Execução manual somente em desenvolvimento. */
async function main() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Este comando exige NODE_ENV=development.');
  }
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  try {
    const repository = app.get(DataSource).getRepository(Space);
    const normalize = (name: string) =>
      name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const existing = await repository.find();
    const catalog = [
      ['Sala de Reunião 1', 8],
      ['Sala de Reunião 2', 12],
      ['Sala de Reunião Master', 20],
      ['Espaço Multiuso', 200],
      ['Mini Auditório', 30],
    ] as const;
    let created = 0;
    for (const [name, capacity] of catalog) {
      if (
        existing.some(
          (space) =>
            normalize(space.name) === normalize(name) ||
            (name.endsWith('Master') &&
              normalize(space.name).startsWith(normalize(name))),
        )
      )
        continue;
      await repository.save(
        repository.create({
          name,
          capacity,
          state: SpaceState.ACTIVE,
          equipment: [],
          photoUrls: [],
        }),
      );
      created++;
    }
    console.log(
      `Catálogo oficial: ${created} espaços adicionados. Cadastros existentes preservados.`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
