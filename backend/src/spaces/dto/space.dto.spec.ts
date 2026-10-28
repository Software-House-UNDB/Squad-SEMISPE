import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SpaceState } from '../entities/space.entity';
import { CreateSpaceDto } from './create-space.dto';
import { UpdateSpaceDto } from './update-space.dto';

describe('Space DTOs (ValidationPipe)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  const requiredFields = { name: 'Miniauditório', capacity: 60 };

  function create(payload: Record<string, unknown>): Promise<CreateSpaceDto> {
    return pipe.transform(payload, {
      type: 'body',
      metatype: CreateSpaceDto,
    }) as Promise<CreateSpaceDto>;
  }

  function update(payload: Record<string, unknown>): Promise<UpdateSpaceDto> {
    return pipe.transform(payload, {
      type: 'body',
      metatype: UpdateSpaceDto,
    }) as Promise<UpdateSpaceDto>;
  }

  it('aceita o cadastro completo e remove espaços nas bordas dos textos', async () => {
    const result = await create({
      name: ' Miniauditório ',
      description: ' Espaço para apresentações. ',
      capacity: 60,
      photoUrls: [' https://example.com/miniauditorio.jpg '],
      equipment: [' Projetor ', 'Microfone'],
      state: SpaceState.INACTIVE,
    });

    expect(result).toEqual({
      ...requiredFields,
      description: 'Espaço para apresentações.',
      photoUrls: ['https://example.com/miniauditorio.jpg'],
      equipment: ['Projetor', 'Microfone'],
      state: SpaceState.INACTIVE,
    });
  });

  it('aceita apenas os campos obrigatórios sem preencher os opcionais no DTO', async () => {
    expect(await create(requiredFields)).toEqual(requiredFields);
  });

  it.each([
    ['nome ausente', { capacity: 60 }],
    ['nome vazio', { ...requiredFields, name: '' }],
    ['nome em branco', { ...requiredFields, name: '   ' }],
    ['nome longo', { ...requiredFields, name: 'a'.repeat(151) }],
    ['nome numérico', { ...requiredFields, name: 123 }],
    ['capacidade ausente', { name: 'Miniauditório' }],
    ['capacidade zero', { ...requiredFields, capacity: 0 }],
    ['capacidade negativa', { ...requiredFields, capacity: -1 }],
    ['capacidade fracionada', { ...requiredFields, capacity: 1.5 }],
    ['capacidade como texto', { ...requiredFields, capacity: '60' }],
    ['capacidade acima do INT', { ...requiredFields, capacity: 2_147_483_648 }],
    ['descrição numérica', { ...requiredFields, description: 123 }],
    ['equipamentos como texto', { ...requiredFields, equipment: 'Projetor' }],
    ['equipamento numérico', { ...requiredFields, equipment: [123] }],
    ['equipamento vazio', { ...requiredFields, equipment: [''] }],
    ['equipamento em branco', { ...requiredFields, equipment: ['   '] }],
    [
      'fotos como texto',
      { ...requiredFields, photoUrls: 'https://example.com' },
    ],
    ['URL inválida', { ...requiredFields, photoUrls: ['não é uma URL'] }],
    [
      'URL sem protocolo',
      { ...requiredFields, photoUrls: ['example.com/foto'] },
    ],
    [
      'URL de arquivo',
      { ...requiredFields, photoUrls: ['file:///tmp/foto.jpg'] },
    ],
    ['foto numérica', { ...requiredFields, photoUrls: [123] }],
    ['status inválido', { ...requiredFields, state: 'manutencao' }],
    ['status numérico', { ...requiredFields, state: 123 }],
  ])('rejeita %s no cadastro', async (_, payload) => {
    await expect(create(payload)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each(['id', 'createdAt', 'updatedAt', 'role'])(
    'rejeita o campo %s controlado pelo servidor ou desconhecido',
    async (field) => {
      await expect(
        create({ ...requiredFields, [field]: 'valor enviado pelo cliente' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('aceita atualização parcial preservando a ausência dos outros campos', async () => {
    expect(await update({ capacity: 80 })).toEqual({ capacity: 80 });
    expect(await update({ state: SpaceState.INACTIVE })).toEqual({ 
      state: SpaceState.INACTIVE,
    });
  });

  it('aceita listas vazias para limpar equipamentos e fotos', async () => {
    const lists = { equipment: [], photoUrls: [] };

    expect(await create({ ...requiredFields, ...lists })).toEqual({
      ...requiredFields,
      ...lists,
    });
    expect(await update(lists)).toEqual(lists);
  });

  it.each(['name', 'capacity', 'equipment', 'photoUrls', 'state'])(
    'rejeita null em %s tanto no cadastro quanto na edição',
    async (field) => {
      await expect(
        create({ ...requiredFields, [field]: null }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(update({ [field]: null })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );

  it('permite limpar a descrição opcional com null', async () => {
    expect(await update({ description: null })).toEqual({ description: null });
  });

  it('mantém as validações na edição parcial', async () => {
    await expect(update({ capacity: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(update({ equipment: ['   '] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(update({ state: 'invalido' })).rejects.toBeInstanceOf(
      BadRequestException,
    )
    await expect(update({ id: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([
    [{ name: '   ' }, 'O nome é obrigatório.'],
    [{ name: 'a'.repeat(151) }, 'O nome deve ter no máximo 150 caracteres.'],
    [{ capacity: 0 }, 'A capacidade deve ser maior que zero.'],
    [{ capacity: 1.5 }, 'A capacidade deve ser um número inteiro.'],
    [
      { photoUrls: ['foto inválida'] },
      'Cada foto deve ser uma URL HTTP ou HTTPS válida.',
    ],
    [{ equipment: 'Projetor' }, 'Os equipamentos devem ser uma lista.'],
    [
      { equipment: ['   '] },
      'O nome de cada equipamento não pode ficar vazio.',
    ],
    [{ description: 123 }, 'A descrição deve ser um texto.'],
    [{ state: 'invalido' }, 'O status deve ser ativo ou inativo.'],
  ])('retorna a mensagem em português para %j', async (payload, message) => {
    const response = {
      statusCode: 400,
      message: [message],
    };

    await expect(
      create({ ...requiredFields, ...payload }),
    ).rejects.toMatchObject({
      response,
    });
    await expect(update(payload)).rejects.toMatchObject({ response });
  });
});
