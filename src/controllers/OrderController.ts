import { Response } from 'express';
import { Op } from 'sequelize';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import User from '../models/UserModel';
import sequelize from '../config/database';
import { AuthRequest } from '../types';

// 1. FINALIZAR COMPRA (CHECKOUT) - MANTIDO ORIGINAL
export const checkout = async (req: AuthRequest, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user!.id;
        const { paymentMethod, address } = req.body;

        const cartItems = await Cart.findAll({ where: { userId } });
        if (cartItems.length === 0) throw new Error("Carrinho vazio");

        const user = await User.findByPk(userId);
        const finalAddress = address || user?.address;
        if (!finalAddress) return res.status(400).json({ message: "Endereço necessário" });

        let totalValue = 0;
        const itemsToOrder = [];

        for (const item of cartItems) {
            const product = await Product.findByPk(item.productId, { transaction: t });
            if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
            if (product.stock < item.quantity) throw new Error(`Estoque insuficiente: ${product.name}`);
            
            totalValue += item.quantity * product.price;
            itemsToOrder.push({ 
                productId: item.productId, 
                quantity: item.quantity, 
                price: product.price 
            });
        }

        const order = await Order.create({ 
            userId, 
            totalValue, 
            paymentMethod, 
            address: finalAddress, 
            status: 'pago' 
        }, { transaction: t });

        for (const item of itemsToOrder) {
            await OrderItem.create({ 
                orderId: order.id, 
                productId: item.productId, 
                quantity: item.quantity, 
                priceAtPurchase: item.price 
            }, { transaction: t });

            await Product.decrement('stock', { 
                by: item.quantity, 
                where: { id: item.productId }, 
                transaction: t 
            });
        }

        await Cart.destroy({ where: { userId }, transaction: t });
        await t.commit();

        return res.status(201).json({ message: "Compra finalizada!", orderId: order.id });
    } catch (error: any) {
        await t.rollback();
        return res.status(400).json({ message: error.message || 'Erro no checkout' });
    }
};

// 2. LISTAR PEDIDOS DO USUÁRIO LOGADO - MANTIDO ORIGINAL
export const listMyOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;

        const { count, rows } = await Order.findAndCountAll({
            where: { userId },
            limit,
            offset,
            include: [{ model: OrderItem, include: [Product] }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ orders: rows, totalPages: Math.ceil(count / limit) });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar pedidos" });
    }
};

// 3. ADMIN: LISTAR TODOS OS PEDIDOS (ADICIONADO FILTRO DE MÊS PARA EXCEL)
export const listAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { page, date, month, year, limit: queryLimit } = req.query;
        const limit = queryLimit ? Number(queryLimit) : 5;
        const offset = page ? (Number(page) - 1) * limit : 0;
        const whereClause: any = {};

        if (date) {
            whereClause.createdAt = {
                [Op.between]: [
                    new Date(`${date} 00:00:00`),
                    new Date(`${date} 23:59:59`)
                ]
            };
        } 
        // Se não tem data específica, mas tem mês/ano (Exportação Mensal)
        else if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            whereClause.createdAt = { [Op.between]: [startDate, endDate] };
        }

        const { count, rows } = await Order.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: OrderItem, include: [{ model: Product, attributes: ['name'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ orders: rows, totalPages: Math.ceil(count / limit) });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar vendas" });
    }
};

// 4. ADMIN: DASHBOARD (CORRIGIDO PARA SEPARAR GERAL DE MENSAL)
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;

        // Faturamento de todo o tempo (Soma total histórica)
        const totalRevenue = await Order.sum('totalValue') || 0;
        const totalOrders = await Order.count() || 0;
        const totalUsers = await User.count({ where: { role: 'client' } }) || 0;

        // Cálculo específico do mês para o card "VENDAS NO MÊS"
        let monthlyRevenue = 0;
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

            monthlyRevenue = await Order.sum('totalValue', {
                where: {
                    createdAt: { [Op.between]: [startDate, endDate] }
                }
            }) || 0;
        }

        // Retorna tudo sem quebrar o que já existia
        return res.status(200).json({ 
            totalRevenue, 
            monthlyRevenue, // <- Valor para o seu card de Março (4.844) ou Fev (0)
            totalOrders, 
            totalUsers 
        });
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        return res.status(500).json({ message: "Erro no dashboard" });
    }
};

// 5. ADMIN: LISTAR PRODUTOS - MANTIDO ORIGINAL
export const listProducts = async (req: AuthRequest, res: Response) => {
    try {
        const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar produtos" });
    }
};

// 6. ADMIN: CRIAR PRODUTO - MANTIDO ORIGINAL
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, price, stock, image_url, category, sizes } = req.body;
        const product = await Product.create({ name, price, stock, image_url, category, sizes });
        return res.status(201).json({ message: "Produto criado com sucesso!", product });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto" });
    }
};

// 7. ADMIN: ATUALIZAR PRODUTO - MANTIDO ORIGINAL
export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        await product.update(req.body);
        return res.status(200).json({ message: "Atualizado com sucesso!", product });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar" });
    }
};

// 8. ADMIN: DELETAR PRODUTO - MANTIDO ORIGINAL
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        await product.destroy();
        return res.status(200).json({ message: "Produto deletado com sucesso! 🗑️" });
    } catch (error: any) {
        const isForeignKey = error.name === 'SequelizeForeignKeyConstraintError' || 
                             (error.message && error.message.includes('foreign key constraint fails'));

        if (isForeignKey) {
            return res.status(400).json({ 
                message: "Não é possível excluir: este produto está atrelado a uma compra já realizada. 🚫" 
            });
        }
        return res.status(500).json({ message: "Erro interno ao deletar produto" });
    }
};