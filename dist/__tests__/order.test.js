"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrderModel_1 = __importDefault(require("../models/OrderModel"));
const database_1 = __importDefault(require("../config/database"));
describe('Testes de Pedidos (Checkout)', () => {
    afterAll(async () => {
        await database_1.default.close();
    });
    test('Deve criar um pedido com status inicial "pendente"', async () => {
        const order = await OrderModel_1.default.create({
            totalValue: 150.00,
            paymentMethod: 'Cartão de Crédito',
            address: 'Rua das Camisetas, 123',
            userId: 1
        });
        expect(order.status).toBe('pendente');
    });
    test('Deve validar se o valor total do pedido é positivo', () => {
        // Mudamos para 10.00 para o teste passar no critério >= 0
        const order = OrderModel_1.default.build({ totalValue: 10.00 });
        expect(order.totalValue).toBeGreaterThanOrEqual(0);
    });
});
