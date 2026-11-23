import * as bcrypt from 'bcrypt';

describe('Compatibilidade de senhas na atualização do bcrypt', () => {
  // Gerado com bcrypt 5.1.1 usando apenas a senha fictícia deste teste.
  const oldHash =
    '$2b$10$TqYITx0TY1tA0zrmbal1He7d3LBcCUXXcPz.gKFtSxGWfSay3WRM2';

  it('verifica hash criado na versão anterior sem redefinir a senha', async () => {
    await expect(
      bcrypt.compare('BcryptCompatibility123!', oldHash),
    ).resolves.toBe(true);
    await expect(bcrypt.compare('senha-incorreta', oldHash)).resolves.toBe(
      false,
    );
  });

  it('continua criando e verificando novos hashes com custo 10', async () => {
    const hash = await bcrypt.hash('NovaSenhaTeste123!', 10);
    expect(bcrypt.getRounds(hash)).toBe(10);
    await expect(bcrypt.compare('NovaSenhaTeste123!', hash)).resolves.toBe(
      true,
    );
  });
});
