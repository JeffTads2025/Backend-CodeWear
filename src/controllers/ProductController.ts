import { Response } from 'express';
import { Op } from 'sequelize';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import User from '../models/UserModel';
import sequelize from '../config/database';
import { AuthRequest } from '../types';

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
        const orderItems: { productId: number; quantity: number; price: number }[] = [];

        for (const item of cartItems) {
            const product = await Product.findByPk(item.productId, { transaction: t });
            if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
            if (product.stock < item.quantity) throw new Error(`Estoque insuficiente: ${product.name}`);
            totalValue += item.quantity * product.price;
            orderItems.push({ productId: item.productId, quantity: item.quantity, price: product.price });
        }

        const order = await Order.create({ userId, totalValue, paymentMethod, address: finalAddress, status: 'pago' }, { transaction: t });
        for (const orderItem of orderItems) {
            await OrderItem.create({ orderId: order.id, productId: orderItem.productId, quantity: orderItem.quantity, priceAtPurchase: orderItem.price }, { transaction: t });
            const product = await Product.findByPk(orderItem.productId, { transaction: t });
            if (product) {
                await product.decrement('stock', { by: orderItem.quantity, transaction: t });
            }
        }
        await Cart.destroy({ where: { userId }, transaction: t });
        await t.commit();
        return res.status(201).json({ message: "Compra finalizada!", orderId: order.id });
    } catch (error) {
        await t.rollback();
        const message = error instanceof Error ? error.message : 'Erro ao processar checkout';
        return res.status(400).json({ message });
    }
};

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

// LISTAGEM COM FILTRO DE DATA
export const listAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, date } = req.query;
        const limit = 5;
        const offset = (Number(page) - 1) * limit;
        const whereClause: { createdAt?: { [key: string]: Date } } = {};

        if (date) {
            whereClause.createdAt = {
                [Op.between]: [
                    new Date(`${date} 00:00:00`),
                    new Date(`${date} 23:59:59`)
                ]
            };
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

// DASHBOARD COM TOTAIS GERAL, MÊS E DIA
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalRevenue = await Order.sum('totalValue') || 0;
        const dailyRevenue = await Order.sum('totalValue', { where: { createdAt: { [Op.gte]: startOfDay } } }) || 0;
        const monthlyRevenue = await Order.sum('totalValue', { where: { createdAt: { [Op.gte]: startOfMonth } } }) || 0;

        return res.status(200).json({ totalRevenue, dailyRevenue, monthlyRevenue });
    } catch (error) {
        return res.status(500).json({ message: "Erro no dashboard" });
    }
};

// LISTAGEM DE PRODUTOS
export const listProducts = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ products: rows, totalPages: Math.ceil(count / limit), total: count });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar produtos" });
    }
};

// CRIAR PRODUTO
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, price, stock, category, sizes, image_url } = req.body;

        if (!name || !price || stock === undefined) {
            return res.status(400).json({ message: "Nome, preço e estoque são obrigatórios" });
        }

        const product = await Product.create({
            name,
            description,
            price,
            stock,
            category,
            sizes: sizes || 'P,M,G,GG',
            image_url: image_url || null
        });
        return res.status(201).json({ message: "Produto criado com sucesso", product });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao criar produto";
        return res.status(500).json({ message });
    }
};

// ATUALIZAR PRODUTO
export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, category, sizes, image_url } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        await product.update({
            name,
            description,
            price,
            stock,
            category,
            sizes: sizes || product.sizes,
            image_url: image_url !== undefined ? image_url : product.image_url
        });
        return res.status(200).json({ message: "Produto atualizado com sucesso", product });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar produto";
        return res.status(500).json({ message });
    }
};

// DELETAR PRODUTO
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        await product.destroy();
        return res.status(200).json({ message: "Produto deletado com sucesso" });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao deletar produto";
        return res.status(500).json({ message });
    }
};