import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { IdeaCategory, IdeaStatus } from '../entities/idea.entity';
import { CreateIdeaDto } from './create-idea.dto';
import { UpdateIdeaDto } from './update-idea.dto';
import { UpdateIdeaStatusDto } from './update-idea-status.dto';

describe('Idea DTOs (ValidationPipe)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  const validIdea = {
    title: 'Ônibus com wi-fi',
    category: IdeaCategory.MOBILITY,
    problem: 'Passageiros sem acesso à internet no trajeto.',
    solution: 'Instalar roteadores nos ônibus municipais.',
    expectedBenefits: 'Inclusão digital no transporte.',
    targetAudience: 'Usuários do transporte público',
    applicationArea: 'Transporte municipal',
  };

  function validate<T>(
    metatype: new () => T,
    payload: Record<string, unknown>,
  ): Promise<T> {
    return pipe.transform(payload, { type: 'body', metatype }) as Promise<T>;
  }
  const create = (payload: Record<string, unknown>) =>
    validate(CreateIdeaDto, payload);
  const update = (payload: Record<string, unknown>) =>
    validate(UpdateIdeaDto, payload);
  const updateStatus = (payload: Record<string, unknown>) =>
    validate(UpdateIdeaStatusDto, payload);

  it('aceita a ideia completa e remove espaços nas bordas dos textos', async () => {
    const result = await create({
      ...validIdea,
      title: '  Ônibus com wi-fi  ',
    });
    expect(result).toEqual(validIdea);
  });

  it.each(Object.values(IdeaCategory))(
    'aceita a categoria %s',
    async (category) => {
      await expect(create({ ...validIdea, category })).resolves.toMatchObject({
        category,
      });
    },
  );

  const requiredFields = Object.keys(validIdea);

  it.each(requiredFields)('rejeita a ideia sem %s', async (field) => {
    const payload: Record<string, unknown> = { ...validIdea };
    delete payload[field];
    await expect(create(payload)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    ['título em branco', { title: '   ' }],
    ['título longo', { title: 'a'.repeat(151) }],
    ['título numérico', { title: 123 }],
    ['categoria inexistente', { category: 'esportes' }],
    ['problema em branco', { problem: '   ' }],
    ['solução longa demais', { solution: 'a'.repeat(5001) }],
    ['público-alvo longo', { targetAudience: 'a'.repeat(256) }],
    ['área de aplicação vazia', { applicationArea: '' }],
  ])('rejeita %s', async (_, override) => {
    await expect(create({ ...validIdea, ...override })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each(['id', 'status', 'authorId', 'author', 'createdAt', 'updatedAt'])(
    'rejeita o campo %s, controlado pelo servidor',
    async (field) => {
      await expect(create({ ...validIdea, [field]: 1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(update({ [field]: 1 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );

  it('aceita edição parcial sem preencher os outros campos', async () => {
    expect(await update({ title: 'Novo título' })).toEqual({
      title: 'Novo título',
    });
  });

  it.each(requiredFields)('rejeita null em %s na edição', async (field) => {
    await expect(update({ [field]: null })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each(Object.values(IdeaStatus))('aceita o status %s', async (status) => {
    expect(await updateStatus({ status })).toEqual({ status });
  });

  it.each([
    ['status inexistente', { status: 'arquivada' }],
    ['status ausente', {}],
    ['campo extra junto do status', { status: 'approved', title: 'x' }],
  ])('rejeita %s na troca de status', async (_, payload) => {
    await expect(updateStatus(payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it.each([
    [{ title: '   ' }, 'O título é obrigatório.'],
    [{ problem: '' }, 'O problema identificado é obrigatório.'],
    [
      { targetAudience: 'a'.repeat(256) },
      'O público-alvo deve ter no máximo 255 caracteres.',
    ],
  ])('retorna a mensagem em português para %j', async (override, message) => {
    await expect(create({ ...validIdea, ...override })).rejects.toMatchObject({
      response: { statusCode: 400, message: [message] },
    });
  });
});
