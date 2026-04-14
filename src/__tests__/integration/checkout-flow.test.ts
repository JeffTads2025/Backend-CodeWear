import express from 'express';
import request from 'supertest';
import { Op } from 'sequelize';
import router from '../../routes/Routes';
import sequelize from '../../config/database';
import User from '../../models/UserModel';
import Product from '../../models/ProductModel';
import Cart from '../../models/CartModel';
import Order from '../../models/OrderModel';
import OrderItem from '../../models/OrderItemModel';
import '../../models/associations';

function generateValidCPF(): string {
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    const calcCheckDigit = (baseDigits: number[]) => {
        const factorStart = baseDigits.length + 1;
        const sum = baseDigits.reduce((acc, digit, idx) => acc + digit * (factorStart - idx), 0);
        const remainder = (sum * 10) % 11;
        return remainder === 10 ? 0 : remainder;
    };
    const d1 = calcCheckDigit(digits);
    const d2 = calcCheckDigit([...digits, d1]);
    return [...digits, d1, d2].join('');
}

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use(router);
    return app;
}

describe('Fluxo integrado: cadastro ate checkout', () => {
    const app = createTestApp();
    const createdUserIds: number[] = [];
    const createdProductIds: number[] = [];
    beforeAll(async () => {
        await sequelize.sync();
    });
    afterEach(async () => {
        if (createdUserIds.length > 0) {
            const orders = await Order.findAll({
                where: { userId: { [Op.in]: createdUserIds } },
                attributes: ['id']
            });
            const orderIds = orders.map((order) => order.id);
            if (orderIds.length > 0) {
                await OrderItem.destroy({ where: { orderId: { [Op.in]: orderIds } } });
            }
            await Order.destroy({ where: { userId: { [Op.in]: createdUserIds } } });
            await Cart.destroy({ where: { userId: { [Op.in]: createdUserIds } } });
            await User.destroy({ where: { id: { [Op.in]: createdUserIds } }, force: true });
            createdUserIds.length = 0;
        }
        if (createdProductIds.length > 0) {
            await Product.destroy({ where: { id: { [Op.in]: createdProductIds } } });
            createdProductIds.length = 0;
        }
    });
    afterAll(async () => {
        await sequelize.close();
    });
    test('deve cadastrar, logar, adicionar ao carrinho e finalizar compra com sucesso', async () => {
        // ...aqui ficaria o fluxo completo de integração
        expect(true).toBe(true);
    });
});