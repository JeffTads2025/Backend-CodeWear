import User from '../models/UserModel';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

describe('Testes de Autenticação e Usuário', () => {
  
  afterAll(async () => {
    await sequelize.close();
  });

  it('Deve criptografar a senha antes de salvar no banco', async () => {
    // Usamos um timestamp para o e-mail nunca ser igual ao de rodadas anteriores
    const uniqueEmail = `teste${Date.now()}@codewear.com`;
    const password = 'senha_segura_123';
    
    const user = await User.create({
      name: 'User Teste',
      email: uniqueEmail,
      password: password,
      cpf: `cpf-${Date.now()}`, // CPF único também
      role: 'client'
    });

    expect(user.password).not.toBe(password);
    const isMatch = await bcrypt.compare(password, user.password);
    expect(isMatch).toBe(true);
  });

  it('Não deve permitir o cadastro de dois usuários com o mesmo E-mail', async () => {
    const duplicateEmail = `duplicado${Date.now()}@codewear.com`;
    
    // Criamos o primeiro
    await User.create({
      name: 'Primeiro',
      email: duplicateEmail,
      password: '123',
      cpf: `cpf1-${Date.now()}`,
      role: 'client'
    });

    try {
      // Tentamos criar o segundo com o MESMO e-mail
      await User.create({
        name: 'Segundo',
        email: duplicateEmail,
        password: '123',
        cpf: `cpf2-${Date.now()}`,
        role: 'client'
      });
    } catch (error: unknown) {
      const err = error as Error;
      expect(err.name).toBe('SequelizeUniqueConstraintError');
    }
  });
});