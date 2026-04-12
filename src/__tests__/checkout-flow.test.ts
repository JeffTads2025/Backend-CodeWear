import express from 'express';
import request from 'supertest';
import { Op } from 'sequelize';
import router from '../routes/Routes';
import sequelize from '../config/database';
import User from '../models/UserModel';
import Product from '../models/ProductModel';
import Cart from '../models/CartModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import '../models/associations';

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
        const suffix = Date.now();
        const email = `flow.${suffix}@codewear.com`;
        const password = 'CodeWear2026';

        const product = await Product.create({
            name: `Produto Fluxo ${suffix}`,
            price: 79.9,
            stock: 8
        });
        createdProductIds.push(product.id);

        const registerResponse = await request(app).post('/users').send({
            name: 'Cliente Fluxo',
            email,
            password,
            cpf: generateValidCPF(),
            phone: '11999990000',
            address: 'Rua Fluxo, 100'
        });

        expect(registerResponse.status).toBe(201);

        const userId = registerResponse.body.id as number;
        createdUserIds.push(userId);

        const loginResponse = await request(app).post('/login').send({ email, password });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toBeDefined();

        const token = loginResponse.body.token as string;

        const addToCartResponse = await request(app)
            .post('/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: product.id, quantity: 2 });

        expect([200, 201]).toContain(addToCartResponse.status);

        const checkoutResponse = await request(app)
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({ paymentMethod: 'pix' });

        expect(checkoutResponse.status).toBe(201);
        expect(checkoutResponse.body.orderId).toBeDefined();

        const createdOrder = await Order.findByPk(checkoutResponse.body.orderId);
        expect(createdOrder).not.toBeNull();
        expect(createdOrder?.userId).toBe(userId);

        const cartItems = await Cart.findAll({ where: { userId } });
        expect(cartItems).toHaveLength(0);

        const updatedProduct = await Product.findByPk(product.id);
        expect(Number(updatedProduct?.stock)).toBe(6);
    });

    test('deve impedir checkout quando o carrinho estiver vazio apos cadastro e login', async () => {
        const suffix = `${Date.now()}-empty`;
        const email = `flow.${suffix}@codewear.com`;
        const password = 'CodeWear2026';

        const registerResponse = await request(app).post('/users').send({
            name: 'Cliente Sem Carrinho',
            email,
            password,
            cpf: generateValidCPF(),
            phone: '11988887777',
            address: 'Rua Sem Carrinho, 200'
        });

        expect(registerResponse.status).toBe(201);

        const userId = registerResponse.body.id as number;
        createdUserIds.push(userId);

        const loginResponse = await request(app).post('/login').send({ email, password });

        expect(loginResponse.status).toBe(200);

        const token = loginResponse.body.token as string;
        const checkoutResponse = await request(app)
            .post('/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({ paymentMethod: 'cartao' });

        expect(checkoutResponse.status).toBe(400);
        expect(checkoutResponse.body.message).toContain('Carrinho vazio');
    });
});
