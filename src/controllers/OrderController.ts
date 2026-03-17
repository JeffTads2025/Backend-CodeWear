import { Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import User from '../models/UserModel';
import sequelize from '../config/database';
import { AuthRequest } from '../types';

// Funções auxiliares para reduzir complexidade
const validateCart = async (userId: number) => {
  const cartItems = await Cart.findAll({ where: { userId }, include: [{ model: Product }] });
  if (cartItems.length === 0) throw new Error("Carrinho vazio");
  return cartItems;
};

const calculateTotal = (cartItems: any[]) => {
  return cartItems.reduce((total, item) => total + item.quantity * item.Product.price, 0);
};

const createOrder = async (userId: number, totalValue: number, paymentMethod: string, address: string, t: any) => {
  return await Order.create({ userId, totalValue, paymentMethod, address, status: 'pago' }, { transaction: t });
};

const createOrderItemsAndUpdateStock = async (orderId: number, cartItems: any[], t: any) => {
  for (const item of cartItems) {
    await OrderItem.create({
      orderId, productId: item.productId, quantity: item.quantity, priceAtPurchase: item.Product.price
    }, { transaction: t });
    await Product.decrement('stock', { by: item.quantity, where: { id: item.productId }, transaction: t });
  }
};

export const checkout = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user!.id;
    const { paymentMethod, address } = req.body;

    const cartItems = await validateCart(userId);
    const user = await User.findByPk(userId);
    const finalAddress = address || user?.address;
    if (!finalAddress) return res.status(400).json({ message: "Endereço necessário" });

    const totalValue = calculateTotal(cartItems);
    const order = await createOrder(userId, totalValue, paymentMethod, finalAddress, t);
    await createOrderItemsAndUpdateStock(order.id, cartItems, t);
    await Cart.destroy({ where: { userId }, transaction: t });

    await t.commit();
    return res.status(201).json({ message: "Compra finalizada!", orderId: order.id });
  } catch (error) {
    await t.rollback();
    const message = error instanceof Error ? error.message : "Erro no checkout";
    return res.status(400).json({ message });
  }
};

export const listMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5;
    const { count, rows } = await Order.findAndCountAll({
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

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const totalRevenue = await Order.sum('totalValue') || 0;
    const totalOrders = await Order.count();
    const totalUsers = await User.count({ where: { role: 'client' } });
    return res.status(200).json({ totalRevenue, totalOrders, totalUsers });
  } catch (error) {
    return res.status(500).json({ message: "Erro no dashboard" });
  }
};