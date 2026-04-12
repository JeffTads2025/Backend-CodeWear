import Product from '../models/ProductModel';
import sequelize from '../config/database';
import { Op } from 'sequelize';

describe('Regras de Negócio: Gestão de Produtos', () => {

    // Limpa produtos de teste criados após cada teste
    afterEach(async () => {
        await Product.destroy({
            where: {
                name: {
                    [Op.like]: 'Produto teste%'
                }
            }
        });
        await Product.destroy({
            where: {
                name: {
                    [Op.like]: 'Produto invalido%'
                }
            }
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('Deve criar produto com categoria padrão Unissex quando não informada', async () => {
        const uniqueName = `Produto teste ${Date.now()}`;

        const product = await Product.create({
            name: uniqueName,
            price: 99.9,
            stock: 3,
        });

        expect(product.name).toBe(uniqueName);
        expect(product.category).toBe('Unissex');
        expect(Number(product.price)).toBe(99.9);
    });

    test('Não deve permitir criar produto com estoque negativo', async () => {
        await expect(
            Product.create({
                name: `Produto invalido ${Date.now()}`,
                price: 50,
                stock: -1,
            })
        ).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    });
});