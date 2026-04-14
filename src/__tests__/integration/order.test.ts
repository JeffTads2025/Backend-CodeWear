import { Op } from 'sequelize';
import Order from '../../models/OrderModel';
import sequelize from '../../config/database';

describe('Testes de Pedidos (Checkout)', () => {
  const createdOrderIds: number[] = [];
  afterEach(async () => {
    if (createdOrderIds.length === 0) return;
    await Order.destroy({ where: { id: { [Op.in]: createdOrderIds } } });
    createdOrderIds.length = 0;
  });
  afterAll(async () => {
    await sequelize.close();
  });
  test('Deve criar um pedido com status inicial "pendente"', async () => {
    const order = await Order.create({
      totalValue: 150.0,
      paymentMethod: 'Cartão de Crédito',
      address: 'Rua das Camisetas, 123',
      userId: 1,
    });
    createdOrderIds.push(order.id);
    expect(order.status).toBe('pendente');
  });
  test('Deve validar se o valor total do pedido é positivo', () => {
    const order = Order.build({ totalValue: 10.0 });
    expect(order.totalValue).toBeGreaterThanOrEqual(0);
  });
});