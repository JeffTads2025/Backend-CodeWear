import User from '../models/UserModel';
import bcrypt from 'bcrypt';
import sequelize from '../config/database';

describe('Testes de Autenticação e Usuário', () => {

  afterAll(async () => {
    await sequelize.close();
  });

  test('Deve criptografar a senha antes de salvar no banco', async () => {
    // Usamos um timestamp para o e-mail nunca ser igual ao de rodadas anteriores
    const uniqueEmail = `teste${Date.now()}@codewear.com`;
    const password = 'senha_segura_123';

    const user = await User.create({
      name: 'User Teste',
      email: uniqueEmail,
      password: password,
      cpf: `cpf-${Date.now()}`, // CPF único também
      role: 'client',
      phone: '11999999999',
      address: 'Rua Teste, 123'
    });

    expect(user.password).not.toBe(password);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });

  test('Não deve permitir o cadastro de dois usuários com o mesmo E-mail', async () => {
    const duplicateEmail = `duplicado${Date.now()}@codewear.com`;

    // Criamos o primeiro
    await User.create({
      name: 'Primeiro',
      email: duplicateEmail,
      password: '123',
      cpf: `cpf1-${Date.now()}`,
      role: 'client',
      phone: '11999999999',
      address: 'Rua Teste, 123'
    });

    await expect(
      User.create({
        name: 'Segundo',
        email: duplicateEmail,
        password: '123',
        cpf: `cpf2-${Date.now()}`,
        role: 'client',
        phone: '11888888888',
        address: 'Rua Teste, 456'
      })
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
  });
});