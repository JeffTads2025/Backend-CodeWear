import { Request, Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import User from '../models/UserModel';
import sequelize from '../config/database';

export const checkout = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const userId = (req as any).user.id;
    const { paymentMethod, address } = req.body;

    const cartItems = await (Cart as any).findAll({ where: { userId }, include: [{ model: Product }] });
    if (cartItems.length === 0) return res.status(400).json({ message: "Carrinho vazio" });

    const user = await User.findByPk(userId);
    const finalAddress = address || user?.address;
    if (!finalAddress) return res.status(400).json({ message: "Endereço necessário" });

    let totalValue = 0;
    cartItems.forEach((item: any) => { totalValue += item.quantity * item.Product.price; });

    const order = await (Order as any).create({
      userId, totalValue, paymentMethod, address: finalAddress, status: 'pago'
    }, { transaction: t });

    for (const item of cartItems) {
      await (OrderItem as any).create({
        orderId: order.id, productId: item.productId, quantity: item.quantity, priceAtPurchase: item.Product.price
      }, { transaction: t });
      
      await (Product as any).decrement('stock', { by: item.quantity, where: { id: item.productId }, transaction: t });
    }

    await (Cart as any).destroy({ where: { userId }, transaction: t });
    await t.commit();
    return res.status(201).json({ message: "Compra finalizada!", orderId: order.id });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: "Erro no checkout" });
  }
};

export const listMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5;

    const { count, rows } = await (Order as any).findAndCountAll({
      where: { userId },
      limit,
      offset: (page - 1) * limit,
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ orders: rows, totalPages: Math.ceil(count / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar pedidos" });
  }
};

export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const totalRevenue = await (Order as any).sum('totalValue') || 0;
    const totalOrders = await (Order as any).count();
    const totalUsers = await User.count({ where: { role: 'client' } });

    return res.status(200).json({ totalRevenue, totalOrders, totalUsers });
  } catch (error) {
    return res.status(500).json({ message: "Erro no dashboard" });
  }
};