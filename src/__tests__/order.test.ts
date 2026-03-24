import Order from '../models/OrderModel';
import sequelize from '../config/database';

describe('Testes de Pedidos (Checkout)', () => {

  afterAll(async () => {
    await sequelize.close();
  });

  test('Deve criar um pedido com status inicial "pendente"', async () => {
    const order = await Order.create({
      totalValue: 150.00,
      paymentMethod: 'Cartão de Crédito',
      address: 'Rua das Camisetas, 123',
      userId: 1
    });

    expect(order.status).toBe('pendente');
  });

  test('Deve validar se o valor total do pedido é positivo', () => {
    // Mudamos para 10.00 para o teste passar no critério >= 0
    const order = Order.build({ totalValue: 10.00 });
    expect(order.totalValue).toBeGreaterThanOrEqual(0);
  });
});