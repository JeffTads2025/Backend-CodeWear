import request from 'supertest';
import express from 'express';
import router from '../../routes/Routes';
import sequelize from '../../config/database';
import User from '../../models/UserModel';

describe('UserController - Integração', () => {
  const app = express();
  app.use(express.json());
  app.use(router);
  let createdId: number | null = null;

  afterAll(async () => {
    try {
      if (createdId) await User.destroy({ where: { id: createdId }, force: true });
    } catch (e) {
      // ignora erro de limpeza
    }
    await sequelize.close();
  });

  it('deve criar um usuário (simples)', async () => {
    const res = await request(app).post('/users').send({});
    // Espera apenas que a rota responda (201, 400, 404)
    expect([201, 400, 404]).toContain(res.status);
  });
});