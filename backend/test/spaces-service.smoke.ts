import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import dataSource from '../src/database/data-source';
import { Space } from '../src/spaces/entities/space.entity';
import { SpacesService } from '../src/spaces/spaces.service';

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'Execute este teste apenas no ambiente local de desenvolvimento.',
    );
  }

  await dataSource.initialize();
  const repository = dataSource.getRepository(Space);
  const fixtureName = `Teste automático de espaços ${randomUUID()}`;

  try {
    const module = await Test.createTestingModule({
      providers: [
        SpacesService,
        { provide: getRepositoryToken(Space), useValue: repository },
      ],
    }).compile();
    const service = module.get(SpacesService);

    try {
      const minimal = await service.create({ name: fixtureName, capacity: 10 });
      const minimalStored = await service.findOne(minimal.id);
      assert.ok(minimalStored.id > 0);
      assert.equal(minimalStored.description, null);
      assert.deepEqual(minimalStored.photoUrls, []);
      assert.deepEqual(minimalStored.equipment, []);
      assert.ok(minimalStored.createdAt instanceof Date);
      assert.ok(minimalStored.updatedAt instanceof Date);

      const full = await service.create({
        name: fixtureName,
        description: 'Espaço de teste temporário.',
        capacity: 60,
        photoUrls: ['https://example.com/espaco.jpg'],
        equipment: ['Projetor', 'Microfone'],
      });
      assert.notEqual(full.id, minimal.id);

      const listed = await service.findAll();
      assert.ok(listed.some((space) => space.id === minimal.id));
      assert.ok(listed.some((space) => space.id === full.id));

      await service.update(full.id, { capacity: 80 });
      const partial = await service.findOne(full.id);
      assert.equal(partial.capacity, 80);
      assert.equal(partial.name, fixtureName);
      assert.equal(partial.description, 'Espaço de teste temporário.');
      assert.deepEqual(partial.photoUrls, ['https://example.com/espaco.jpg']);
      assert.deepEqual(partial.equipment, ['Projetor', 'Microfone']);

      await service.update(full.id, { equipment: ['TV'] });
      const replaced = await service.findOne(full.id);
      assert.deepEqual(replaced.equipment, ['TV']);
      assert.deepEqual(replaced.photoUrls, ['https://example.com/espaco.jpg']);

      await service.update(full.id, { equipment: [], photoUrls: [] });
      const cleared = await service.findOne(full.id);
      assert.deepEqual(cleared.equipment, []);
      assert.deepEqual(cleared.photoUrls, []);
      assert.equal(cleared.capacity, 80);

      await service.update(full.id, { description: null });
      assert.equal((await service.findOne(full.id)).description, null);

      await service.remove(full.id);
      assert.equal(await repository.countBy({ id: full.id }), 0);
      await assert.rejects(() => service.findOne(full.id), NotFoundException);
      await assert.rejects(
        () => service.update(full.id, { capacity: 20 }),
        NotFoundException,
      );
      await assert.rejects(() => service.remove(full.id), NotFoundException);
    } finally {
      await module.close();
    }
  } finally {
    try {
      // A limpeza usa o nome exclusivo destes registros de teste.
      await repository.delete({ name: fixtureName });
      assert.equal(await repository.countBy({ name: fixtureName }), 0);
    } finally {
      await dataSource.destroy();
    }
  }

  console.log(
    'CRUD do SpacesService no MySQL: OK. Registros de teste removidos.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
