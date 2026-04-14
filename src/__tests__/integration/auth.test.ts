import User from '../../models/UserModel';
import * as bcrypt from 'bcrypt';
import sequelize from '../../config/database';
import { Op } from 'sequelize';

describe('Testes de Autenticação e Usuário', () => {
  const createdUserIds: number[] = [];
  afterEach(async () => {
    if (createdUserIds.length === 0) return;
    await User.destroy({ where: { id: { [Op.in]: createdUserIds } }, force: true });
    createdUserIds.length = 0;
  });
  afterAll(async () => {
    await sequelize.close();
  });
  test('Deve criptografar a senha antes de salvar no banco', async () => {
    const uniqueEmail = `teste${Date.now()}@codewear.com`;
    const password = 'senha_segura_123';
    const user = await User.create({
      name: 'User Teste',
      email: uniqueEmail,
      password: password,
      cpf: `cpf-${Date.now()}`,
      role: 'client',
      phone: '11999999999',
      address: 'Rua Teste, 123'
    });
    createdUserIds.push(user.id);
    expect(user.password).not.toBe(password);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });
  test('Não deve permitir o cadastro de dois usuários com o mesmo E-mail', async () => {
    const duplicateEmail = `duplicado${Date.now()}@codewear.com`;
    const firstUser = await User.create({
      name: 'Primeiro',
      email: duplicateEmail,
      password: '123',
      cpf: `cpf1-${Date.now()}`,
      role: 'client',
      phone: '11999999999',
      address: 'Rua Teste, 123'
    });
    createdUserIds.push(firstUser.id);
    await expect(User.create({
      name: 'Segundo',
      email: duplicateEmail,
      password: '456',
      cpf: `cpf2-${Date.now()}`,
      role: 'client',
      phone: '11999999999',
      address: 'Rua Teste, 123'
    })).rejects.toThrow();
  });
});