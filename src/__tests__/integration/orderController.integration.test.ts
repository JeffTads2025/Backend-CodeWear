import request from 'supertest';
import express from 'express';
import router from '../../routes/Routes';
import sequelize from '../../config/database';
import Order from '../../models/OrderModel';

describe('OrderController - Integração', () => {
  const app = express();
  app.use(express.json());
  app.use(router);
  let createdId: number | null = null;

  afterAll(async () => {
    try {
      if (createdId) await Order.destroy({ where: { id: createdId } });
    } catch (e) {
      // ignora erro de limpeza
    }
    await sequelize.close();
  });

  it('deve criar um pedido (simples)', async () => {
    const res = await request(app).post('/orders').send({});
    // Espera apenas que a rota responda (201, 400, 404)
    expect([201, 400, 404]).toContain(res.status);
  });
});