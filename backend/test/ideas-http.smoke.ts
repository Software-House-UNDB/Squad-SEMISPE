import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import dataSource from '../src/database/data-source';
import { Idea, IdeaStatus } from '../src/ideas/entities/idea.entity';
import { Role, User } from '../src/users/entities/user.entity';

interface LoginResponse {
  accessToken: string;
  user: { id: number; role: Role };
}

interface IdeaResponse {
  id: number;
  title: string;
  status: IdeaStatus;
  authorId: number;
  author?: Record<string, unknown>;
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
  return {
    status: response.status,
    body: (text ? JSON.parse(text) : undefined) as T,
  };
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error(
      'Execute este teste apenas no ambiente local de desenvolvimento.',
    );
  }

  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const ideas = dataSource.getRepository(Idea);
  const suffix = randomUUID();
  const emails = {
    author: `ideas-author-${suffix}@example.com`,
    other: `ideas-other-${suffix}@example.com`,
    admin: `ideas-admin-${suffix}@example.com`,
  };
  const password = 'IdeiasTeste123!';

  try {
    const tokens: Record<keyof typeof emails, string> = {
      author: '',
      other: '',
      admin: '',
    };
    for (const key of Object.keys(emails) as (keyof typeof emails)[]) {
      const created = await http('POST', '/users', {
        name: `Teste ideias ${key}`,
        institution: 'Instituição de teste',
        phone: '98912345678',
        email: emails[key],
        password,
      });
      assert.equal(created.status, 201);
    }
    // Promove só a conta temporária de admin, diretamente no banco local.
    await users.update({ email: emails.admin }, { role: Role.ADMIN });
    for (const key of Object.keys(emails) as (keyof typeof emails)[]) {
      const login = await http<LoginResponse>('POST', '/auth/login', {
        email: emails[key],
        password,
      });
      assert.equal(login.status, 200);
      tokens[key] = login.body.accessToken;
    }

    const payload = {
      title: `Ideia de teste ${suffix}`,
      category: 'mobility',
      problem: 'Problema de teste.',
      solution: 'Solução de teste.',
      expectedBenefits: 'Benefícios de teste.',
      targetAudience: 'Público de teste',
      applicationArea: 'Área de teste',
    };

    // Envio
    assert.equal((await http('POST', '/ideas', payload)).status, 401);
    const created = await http<IdeaResponse>(
      'POST',
      '/ideas',
      payload,
      tokens.author,
    );
    assert.equal(created.status, 201);
    assert.equal(created.body.status, IdeaStatus.SUBMITTED);
    const author = created.body.author ?? {};
    assert.equal(author.email, emails.author);
    for (const hidden of ['password', 'cpf', 'cnpj', 'role']) {
      assert.ok(!(hidden in author), `o autor não deve expor ${hidden}`);
    }
    const path = `/ideas/${created.body.id}`;

    // Consultas
    const mine = await http<IdeaResponse[]>(
      'GET',
      '/ideas/mine',
      undefined,
      tokens.author,
    );
    assert.equal(mine.status, 200);
    assert.ok(mine.body.some((idea) => idea.id === created.body.id));
    const othersMine = await http<IdeaResponse[]>(
      'GET',
      '/ideas/mine',
      undefined,
      tokens.other,
    );
    assert.ok(!othersMine.body.some((idea) => idea.id === created.body.id));
    assert.equal(
      (await http('GET', '/ideas', undefined, tokens.author)).status,
      403,
    );
    const filtered = await http<IdeaResponse[]>(
      'GET',
      '/ideas?category=mobility&status=submitted',
      undefined,
      tokens.admin,
    );
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.some((idea) => idea.id === created.body.id));
    assert.equal(
      (await http('GET', path, undefined, tokens.author)).status,
      200,
    );
    assert.equal(
      (await http('GET', path, undefined, tokens.admin)).status,
      200,
    );
    assert.equal(
      (await http('GET', path, undefined, tokens.other)).status,
      403,
    );

    // Edição pelo autor enquanto submitted
    assert.equal(
      (await http('PATCH', path, { title: 'Outro' }, tokens.other)).status,
      403,
    );
    const edited = await http<IdeaResponse>(
      'PATCH',
      path,
      { title: `${payload.title} (editada)` },
      tokens.author,
    );
    assert.equal(edited.status, 200);
    assert.equal(edited.body.title, `${payload.title} (editada)`);

    // Troca de status
    assert.equal(
      (
        await http(
          'PATCH',
          `${path}/status`,
          { status: 'evaluation' },
          tokens.author,
        )
      ).status,
      403,
    );
    const evaluated = await http<IdeaResponse>(
      'PATCH',
      `${path}/status`,
      { status: 'evaluation' },
      tokens.admin,
    );
    assert.equal(evaluated.status, 200);
    assert.equal(evaluated.body.status, IdeaStatus.EVALUATION);

    // Depois da avaliação começar, o autor fica travado
    assert.equal(
      (await http('PATCH', path, { title: 'Tarde' }, tokens.author)).status,
      409,
    );
    assert.equal(
      (await http('DELETE', path, undefined, tokens.author)).status,
      409,
    );

    // Exclusão: admin a qualquer momento
    assert.equal(
      (await http('DELETE', path, undefined, tokens.admin)).status,
      200,
    );
    assert.equal(
      (await http('GET', path, undefined, tokens.admin)).status,
      404,
    );

    // Exclusão pelo próprio autor enquanto submitted
    const second = await http<IdeaResponse>(
      'POST',
      '/ideas',
      payload,
      tokens.author,
    );
    assert.equal(
      (
        await http(
          'DELETE',
          `/ideas/${second.body.id}`,
          undefined,
          tokens.author,
        )
      ).status,
      200,
    );
    assert.equal(await ideas.countBy({ id: second.body.id }), 0);
  } finally {
    try {
      const temporary = await users.findBy(
        Object.values(emails).map((email) => ({ email })),
      );
      const ids = temporary.map((user) => user.id);
      if (ids.length > 0) {
        await ideas.delete(ids.map((authorId) => ({ authorId })));
        await users.delete(ids);
      }
      for (const email of Object.values(emails)) {
        assert.equal(await users.countBy({ email }), 0);
      }
    } finally {
      await dataSource.destroy();
    }
  }

  console.log(
    'Rotas do Banco de Ideias no MySQL: OK. Permissões e regras conferidas; registros temporários removidos.',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
