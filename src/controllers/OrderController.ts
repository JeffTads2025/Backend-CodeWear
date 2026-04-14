import { Response } from 'express';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import User from '../models/UserModel';
import AuditLog from '../models/AuditLogModel';
import sequelize from '../config/database';
import { AuthRequest } from '../types';
import { getActiveClientWhereClause } from '../utils/accountCancellation';

interface CheckoutOrderItem {
    productId: number;
    quantity: number;
    price: number;
}

function canManageOrder(order: Order, req: AuthRequest): boolean {
    const isOwner = order.userId === req.user!.id;
    const isAdmin = req.user!.role === 'admin';

    return isOwner || isAdmin;
}

async function getOrderCustomerName(order: Order, transaction: Transaction): Promise<string> {
    const orderUser = await User.findByPk(order.userId, {
        attributes: ['name'],
        transaction
    });

    return orderUser?.name || `ID ${order.userId}`;
}

async function createDeleteOrderAuditLog(req: AuthRequest, order: Order, transaction: Transaction): Promise<void> {
    const customerName = await getOrderCustomerName(order, transaction);

    await AuditLog.create({
        adminId: req.user!.id,
        adminName: req.user!.name,
        action: 'DELETE_ORDER',
        details: `Pedido #${order.id} | Cliente ${customerName} | Total R$ ${Number(order.totalValue || 0).toFixed(2)}`
    }, { transaction });
}

async function removeOrderWithItems(order: Order, transaction: Transaction): Promise<void> {
    await OrderItem.destroy({ where: { orderId: order.id }, transaction });
    await order.destroy({ transaction });
}

// 1. FINALIZAR COMPRA (CHECKOUT) 
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
        const itemsToOrder: CheckoutOrderItem[] = [];

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
    } catch (error) {
        await t.rollback();
        const message = error instanceof Error ? error.message : 'Erro no checkout';
        return res.status(400).json({ message });
    }
};

// 2. LISTAR PEDIDOS DO USUÁRIO LOGADO 
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

// 3. ADMIN: LISTAR TODOS OS PEDIDOS 
export const listAllOrdersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { page, date, month, year, limit: queryLimit } = req.query;
        const limit = queryLimit ? Number(queryLimit) : 5;
        const offset = page ? (Number(page) - 1) * limit : 0;
        const whereClause: WhereOptions = date
            ? {
                createdAt: {
                    [Op.between]: [
                        new Date(`${date} 00:00:00`),
                        new Date(`${date} 23:59:59`)
                    ]
                }
            }
            : month && year
                ? {
                    createdAt: {
                        [Op.between]: [
                            new Date(Number(year), Number(month) - 1, 1, 0, 0, 0),
                            new Date(Number(year), Number(month), 0, 23, 59, 59)
                        ]
                    }
                }
                : {};

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

// 4. ADMIN: DASHBOARD 
export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;

        // TOTAL
        const totalRevenue = await Order.sum('totalValue') || 0;
        const totalOrders = await Order.count() || 0;
        const totalUsers = await User.count({ where: getActiveClientWhereClause() }) || 0;

        // Cálculo específico do mês 
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

        // Retorna tudo 
        return res.status(200).json({
            totalRevenue,
            monthlyRevenue, 
            totalOrders,
            totalUsers
        });
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        return res.status(500).json({ message: "Erro no dashboard" });
    }
};

// 5. ADMIN: LISTAR PRODUTOS 
export const listProducts = async (req: AuthRequest, res: Response) => {
    try {
        const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar produtos" });
    }
};

// 6. ADMIN: CRIAR PRODUTO
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, price, stock, image_url } = req.body;
        const product = await Product.create({ name, price, stock, image_url });
        return res.status(201).json({ message: "Produto criado com sucesso!", product });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto" });
    }
};

// 7. ADMIN: ATUALIZAR PRODUTO 
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

// 8. ADMIN: DELETAR PRODUTO 
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        await product.destroy();
        return res.status(200).json({ message: "Produto deletado com sucesso! 🗑️" });
    } catch (error) {
        const isForeignKey = error instanceof Error && (
            error.name === 'SequelizeForeignKeyConstraintError' ||
            error.message.includes('foreign key constraint fails')
        );

        if (isForeignKey) {
            return res.status(400).json({
                message: "Não é possível excluir: este produto está atrelado a uma compra já realizada. 🚫"
            });
        }
        return res.status(500).json({ message: "Erro interno ao deletar produto" });
    }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status, address, paymentMethod } = req.body;

        const order = await Order.findByPk(id);

        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        const isOwner = order.userId === req.user!.id;
        const isAdmin = req.user!.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Sem permissão para atualizar este pedido" });
        }

        await order.update({
            status: status ?? order.status,
            address: address ?? order.address,
            paymentMethod: paymentMethod ?? order.paymentMethod,
        });

        return res.status(200).json({ message: "Pedido atualizado com sucesso", order });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar pedido" });
    }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, { transaction: t });

        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        if (!canManageOrder(order, req)) {
            await t.rollback();
            return res.status(403).json({ message: "Sem permissão para remover este pedido" });
        }

        await createDeleteOrderAuditLog(req, order, t);
        await removeOrderWithItems(order, t);
        await t.commit();

        return res.status(200).json({ message: "Pedido removido com sucesso" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ message: "Erro ao remover pedido" });
    }
};