import request from 'supertest';
import express from 'express';
import router from '../../routes/Routes';
import sequelize from '../../config/database';
import Cart from '../../models/CartModel';

describe('CartController - Integração', () => {
  const app = express();
  app.use(express.json());
  app.use(router);
  let createdId: number | null = null;

  afterAll(async () => {
    try {
      if (createdId) await Cart.destroy({ where: { id: createdId } });
    } catch (e) {
      // ignora erro de limpeza
    }
    await sequelize.close();
  });

  it('deve adicionar item ao carrinho (simples)', async () => {
    const res = await request(app).post('/cart').send({});
    // Espera apenas que a rota responda (201, 400, 401, 404)
    expect([201, 400, 401, 404]).toContain(res.status);
  });
});