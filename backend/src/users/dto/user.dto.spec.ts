import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});
const valid = {
  name: 'Teste',
  email: 'test@example.com',
  password: 'password123',
};
const validate = (
  payload: object,
  metatype: typeof CreateUserDto | typeof UpdateUserDto,
) => pipe.transform(payload, { type: 'body', metatype });
describe('User DTOs', () => {
  it.each(['name', 'email', 'password'])(
    'rejeita null em %s',
    async (field) => {
      await expect(
        validate({ ...valid, [field]: null }, CreateUserDto),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({ [field]: null }, UpdateUserDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
  it('preserva campos omitidos', async () => {
    await expect(validate({}, UpdateUserDto)).resolves.toEqual({});
  });
  it.each(['institution', 'cpf', 'cnpj', 'phone'])(
    'permite limpar %s',
    async (field) => {
      await expect(validate({ [field]: null }, UpdateUserDto)).resolves.toEqual(
        { [field]: null },
      );
    },
  );
  it('normaliza nome e email e rejeita nome em branco', async () => {
    await expect(
      validate(
        { ...valid, name: ' Teste ', email: ' TEST@EXAMPLE.COM ' },
        CreateUserDto,
      ),
    ).resolves.toMatchObject(valid);
    await expect(
      validate({ ...valid, name: '   ' }, CreateUserDto),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it.each([CreateUserDto, UpdateUserDto])(
    'valida limites',
    async (metatype) => {
      await expect(
        validate(
          { ...valid, email: 'x'.repeat(250) + '@example.com' },
          metatype,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({ ...valid, password: 'a'.repeat(72) }, metatype),
      ).resolves.toMatchObject({ password: 'a'.repeat(72) });
      await expect(
        validate({ ...valid, password: 'a'.repeat(73) }, metatype),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        validate({ ...valid, password: 'á'.repeat(37) }, metatype),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
