import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import dataSource from '../src/database/data-source';
import { Space } from '../src/spaces/entities/space.entity';
import { Role, User } from '../src/users/entities/user.entity';

interface UserResponse {
  id: number;
  email: string;
  role: Role;
}

interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

interface SpaceResponse {
  id: number;
  name: string;
  description: string | null;
  capacity: number;
  photoUrls: string[];
  equipment: string[];
  createdAt: string;
  updatedAt: string;
}

interface ErrorResponse {
  message: string | string[];
}

const baseUrl = `http://127.0.0.1:${process.env.PORT ?? '3000'}/api`;

async function http<T>(
  method: string,
  path: string,
  payload?: unknown,
  token?: string,
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  const body = (text ? JSON.parse(text) : undefined) as T;
  return { status: response.status, body };
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'Execute este teste apenas no ambiente local de desenvolvimento.',
    );
  }

  await dataSource.initialize();
  const spaces = dataSource.getRepository(Space);
  const users = dataSource.getRepository(User);
  const suffix = randomUUID();
  const fixtureName = `Teste HTTP de espaços ${suffix}`;
  const userEmail = `spaces-user-${suffix}@example.com`;
  const adminEmail = `spaces-admin-${suffix}@example.com`;
  const password = 'EspacosTeste123!';

  try {
    for (const email of [userEmail, adminEmail]) {
      const created = await http<UserResponse>('POST', '/users', {
        name: fixtureName,
        email,
        password,
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.role, Role.USER);
    }
    // Prepara apenas a conta temporária de admin, diretamente no banco local.
    await users.update({ email: adminEmail }, { role: Role.ADMIN });

    const userLogin = await http<LoginResponse>('POST', '/auth/login', {
      email: userEmail,
      password,
    });
    const adminLogin = await http<LoginResponse>('POST', '/auth/login', {
      email: adminEmail,
      password,
    });
    assert.equal(userLogin.status, 200);
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.user.role, Role.ADMIN);
    const userToken = userLogin.body.accessToken;
    const adminToken = adminLogin.body.accessToken;

    const payload = {
      name: fixtureName,
      description: 'Espaço temporário do teste HTTP.',
      capacity: 60,
      photoUrls: ['https://example.com/espaco.jpg'],
      equipment: ['Projetor', 'Microfone'],
    };
    assert.equal((await http('GET', '/spaces')).status, 200);
    assert.equal((await http('POST', '/spaces', payload)).status, 401);
    assert.equal(
      (await http('POST', '/spaces', payload, userToken)).status,
      403,
    );
    assert.equal(
      (await http('POST', '/spaces', payload, 'token-invalido')).status,
      401,
    );

    const invalid = await http<ErrorResponse>(
      'POST',
      '/spaces',
      { ...payload, capacity: 0 },
      adminToken,
    );
    assert.equal(invalid.status, 400);
    assert.deepEqual(invalid.body.message, [
      'A capacidade deve ser maior que zero.',
    ]);

    const created = await http<SpaceResponse>(
      'POST',
      '/spaces',
      payload,
      adminToken,
    );
    assert.equal(created.status, 201);
    assert.deepEqual(created.body.equipment, ['Projetor', 'Microfone']);
    const path = `/spaces/${created.body.id}`;

    assert.equal((await http('GET', path)).status, 200);
    assert.equal((await http('GET', '/spaces/abc')).status, 400);
    assert.equal((await http('PATCH', path, { capacity: 80 })).status, 401);
    assert.equal(
      (await http('PATCH', path, { capacity: 80 }, userToken)).status,
      403,
    );
    assert.equal((await http('DELETE', path)).status, 401);
    assert.equal(
      (await http('DELETE', path, undefined, userToken)).status,
      403,
    );

    const updated = await http<SpaceResponse>(
      'PATCH',
      path,
      { capacity: 80 },
      adminToken,
    );
    assert.equal(updated.status, 200);
    assert.equal(updated.body.capacity, 80);
    assert.deepEqual(updated.body.equipment, ['Projetor', 'Microfone']);
    assert.deepEqual(updated.body.photoUrls, payload.photoUrls);

    assert.equal(
      (await http('PATCH', path, { equipment: ['TV'] }, adminToken)).status,
      200,
    );
    assert.deepEqual((await http<SpaceResponse>('GET', path)).body.equipment, [
      'TV',
    ]);

    const cleared = await http<SpaceResponse>(
      'PATCH',
      path,
      { equipment: [], photoUrls: [], description: null },
      adminToken,
    );
    assert.equal(cleared.status, 200);
    assert.deepEqual(cleared.body.equipment, []);
    assert.deepEqual(cleared.body.photoUrls, []);
    assert.equal(cleared.body.description, null);

    const extraField = await http('PATCH', path, { role: 'admin' }, adminToken);
    assert.equal(extraField.status, 400);

    assert.equal(
      (await http('DELETE', path, undefined, adminToken)).status,
      200,
    );
    assert.equal(await spaces.countBy({ id: created.body.id }), 0);
    assert.equal((await http('GET', path)).status, 404);
    assert.equal(
      (await http('PATCH', path, { capacity: 20 }, adminToken)).status,
      404,
    );
    assert.equal(
      (await http('DELETE', path, undefined, adminToken)).status,
      404,
    );
  } finally {
    try {
      await spaces.delete({ name: fixtureName });
      await users.delete({ email: userEmail });
      await users.delete({ email: adminEmail });
      assert.equal(await spaces.countBy({ name: fixtureName }), 0);
      assert.equal(await users.countBy({ email: userEmail }), 0);
      assert.equal(await users.countBy({ email: adminEmail }), 0);
    } finally {
      await dataSource.destroy();
    }
  }

  console.log(
    'Rotas de espaços no MySQL: OK. Permissões e CRUD conferidos; registros temporários removidos.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
