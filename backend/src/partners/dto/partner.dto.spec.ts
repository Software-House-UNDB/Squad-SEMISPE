import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreatePartnerDto } from './create-partner.dto';
import { UpdatePartnerDto } from './update-partner.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});
const valid = {
  name: 'Parceiro',
  email: 'p@example.com',
  description: 'Descrição',
  shortDescription: 'Resumo',
};
const validate = (
  payload: object,
  metatype: typeof CreatePartnerDto | typeof UpdatePartnerDto,
) => pipe.transform(payload, { type: 'body', metatype });

describe('Partner DTOs', () => {
  it.each([CreatePartnerDto, UpdatePartnerDto])(
    'rejeita descrições acima do limite e textos em branco',
    async (metatype) => {
      for (const change of [
        { description: 'x'.repeat(70000) },
        { name: '   ' },
        { description: '  ' },
        { shortDescription: '  ' },
      ]) {
        await expect(
          validate({ ...valid, ...change }, metatype),
        ).rejects.toBeInstanceOf(BadRequestException);
      }
    },
  );
  it('normaliza textos e e-mail antes de persistir', async () => {
    await expect(
      validate(
        {
          ...valid,
          name: ' Parceiro ',
          email: ' P@EXAMPLE.COM ',
          description: ' Descrição ',
        },
        CreatePartnerDto,
      ),
    ).resolves.toEqual(valid);
  });
  it.each(['name', 'email', 'description', 'shortDescription', 'category'])(
    'rejeita null em %s no POST e PATCH',
    async (field) => {
      await expect(
        validate({ ...valid, [field]: null }, CreatePartnerDto),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({ [field]: null }, UpdatePartnerDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
  it('aceita omissão e limpeza de logo no PATCH', async () => {
    await expect(validate({}, UpdatePartnerDto)).resolves.toEqual({});
    await expect(
      validate({ logoUrl: null }, UpdatePartnerDto),
    ).resolves.toEqual({ logoUrl: null });
  });
  it('aceita cadastro sem campos opcionais e entidades de apoio', async () => {
    await expect(validate(valid, CreatePartnerDto)).resolves.toEqual(valid);
    await expect(
      validate({ ...valid, category: 'support_entity' }, CreatePartnerDto),
    ).resolves.toMatchObject({ category: 'support_entity' });
  });
  it.each([CreatePartnerDto, UpdatePartnerDto])(
    'valida o limite da URL',
    async (metatype) => {
      const prefix = 'https://example.com/';
      const url = prefix + 'a'.repeat(255 - prefix.length);
      await expect(
        validate({ ...valid, logoUrl: url }, metatype),
      ).resolves.toMatchObject({ logoUrl: url });
      await expect(
        validate({ ...valid, logoUrl: url + 'a' }, metatype),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
