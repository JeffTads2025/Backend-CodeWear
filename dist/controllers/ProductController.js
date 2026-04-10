"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.listProducts = exports.getAdminDashboard = exports.listAllOrdersAdmin = exports.listMyOrders = exports.checkout = void 0;
const sequelize_1 = require("sequelize");
const CartModel_1 = __importDefault(require("../models/CartModel"));
const ProductModel_1 = __importDefault(require("../models/ProductModel"));
const OrderModel_1 = __importDefault(require("../models/OrderModel"));
const OrderItemModel_1 = __importDefault(require("../models/OrderItemModel"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const AuditLogModel_1 = __importDefault(require("../models/AuditLogModel"));
const database_1 = __importDefault(require("../config/database"));
const checkout = async (req, res) => {
    const t = await database_1.default.transaction();
    try {
        const userId = req.user.id;
        const { paymentMethod, address } = req.body;
        const cartItems = await CartModel_1.default.findAll({ where: { userId } });
        if (cartItems.length === 0)
            throw new Error("Carrinho vazio");
        const user = await UserModel_1.default.findByPk(userId);
        const finalAddress = address || user?.address;
        if (!finalAddress)
            return res.status(400).json({ message: "Endereço necessário" });
        let totalValue = 0;
        const orderItems = [];
        for (const item of cartItems) {
            const product = await ProductModel_1.default.findByPk(item.productId, { transaction: t });
            if (!product)
                throw new Error(`Produto ${item.productId} não encontrado`);
            if (product.stock < item.quantity)
                throw new Error(`Estoque insuficiente: ${product.name}`);
            totalValue += item.quantity * product.price;
            orderItems.push({ productId: item.productId, quantity: item.quantity, price: product.price });
        }
        const order = await OrderModel_1.default.create({ userId, totalValue, paymentMethod, address: finalAddress, status: 'pago' }, { transaction: t });
        for (const orderItem of orderItems) {
            await OrderItemModel_1.default.create({ orderId: order.id, productId: orderItem.productId, quantity: orderItem.quantity, priceAtPurchase: orderItem.price }, { transaction: t });
            const product = await ProductModel_1.default.findByPk(orderItem.productId, { transaction: t });
            if (product) {
                await product.decrement('stock', { by: orderItem.quantity, transaction: t });
            }
        }
        await CartModel_1.default.destroy({ where: { userId }, transaction: t });
        await t.commit();
        return res.status(201).json({ message: "Compra finalizada!", orderId: order.id });
    }
    catch (error) {
        await t.rollback();
        const message = error instanceof Error ? error.message : 'Erro ao processar checkout';
        return res.status(400).json({ message });
    }
};
exports.checkout = checkout;
const listMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;
        const { count, rows } = await OrderModel_1.default.findAndCountAll({
            where: { userId },
            limit,
            offset,
            include: [{ model: OrderItemModel_1.default, include: [ProductModel_1.default] }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ orders: rows, totalPages: Math.ceil(count / limit) });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao listar pedidos" });
    }
};
exports.listMyOrders = listMyOrders;
// LISTAGEM COM FILTRO DE DATA
const listAllOrdersAdmin = async (req, res) => {
    try {
        const { page = 1, date } = req.query;
        const limit = 5;
        const offset = (Number(page) - 1) * limit;
        const whereClause = {};
        if (date) {
            whereClause.createdAt = {
                [sequelize_1.Op.between]: [
                    new Date(`${date} 00:00:00`),
                    new Date(`${date} 23:59:59`)
                ]
            };
        }
        const { count, rows } = await OrderModel_1.default.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            include: [
                { model: UserModel_1.default, attributes: ['name', 'email'] },
                { model: OrderItemModel_1.default, include: [{ model: ProductModel_1.default, attributes: ['name'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ orders: rows, totalPages: Math.ceil(count / limit) });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao buscar vendas" });
    }
};
exports.listAllOrdersAdmin = listAllOrdersAdmin;
// DASHBOARD COM TOTAIS GERAL, MÊS E DIA
const getAdminDashboard = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const totalRevenue = await OrderModel_1.default.sum('totalValue') || 0;
        const dailyRevenue = await OrderModel_1.default.sum('totalValue', { where: { createdAt: { [sequelize_1.Op.gte]: startOfDay } } }) || 0;
        const monthlyRevenue = await OrderModel_1.default.sum('totalValue', { where: { createdAt: { [sequelize_1.Op.gte]: startOfMonth } } }) || 0;
        return res.status(200).json({ totalRevenue, dailyRevenue, monthlyRevenue });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro no dashboard" });
    }
};
exports.getAdminDashboard = getAdminDashboard;
// LISTAGEM DE PRODUTOS
const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await ProductModel_1.default.findAndCountAll({
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ products: rows, totalPages: Math.ceil(count / limit), total: count });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao listar produtos" });
    }
};
exports.listProducts = listProducts;
// CRIAR PRODUTO
const createProduct = async (req, res) => {
    try {
        const { name, price, stock, image_url } = req.body;
        if (!name || !price || stock === undefined) {
            return res.status(400).json({ message: "Nome, preço e estoque são obrigatórios" });
        }
        const product = await ProductModel_1.default.create({
            name,
            price,
            stock,
            image_url: image_url || null
        });
        // LOG DE AUDITORIA
        await AuditLogModel_1.default.create({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'CREATE_PRODUCT',
            details: `Criou produto "${name}" com preço R$ ${price} e estoque ${stock}`
        });
        return res.status(201).json({ message: "Produto criado com sucesso", product });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao criar produto";
        return res.status(500).json({ message });
    }
};
exports.createProduct = createProduct;
// ATUALIZAR PRODUTO
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock, image_url } = req.body;
        const product = await ProductModel_1.default.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }
        const oldData = { name: product.name, price: product.price, stock: product.stock, image_url: product.image_url };
        await product.update({
            name,
            price,
            stock,
            image_url: image_url !== undefined ? image_url : product.image_url
        });
        // LOG DE AUDITORIA
        let details = `Atualizou produto "${oldData.name}"`;
        if (oldData.price !== price)
            details += ` - Preço: R$ ${oldData.price} → R$ ${price}`;
        if (oldData.stock !== stock)
            details += ` - Estoque: ${oldData.stock} → ${stock}`;
        if (oldData.image_url !== image_url)
            details += ` - Imagem alterada`;
        await AuditLogModel_1.default.create({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'UPDATE_PRODUCT',
            details
        });
        return res.status(200).json({ message: "Produto atualizado com sucesso", product });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao atualizar produto";
        return res.status(500).json({ message });
    }
};
exports.updateProduct = updateProduct;
// DELETAR PRODUTO
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel_1.default.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }
        // LOG DE AUDITORIA ANTES DE DELETAR
        await AuditLogModel_1.default.create({
            adminId: req.user.id,
            adminName: req.user.name,
            action: 'DELETE_PRODUCT',
            details: `Deletou produto "${product.name}" (ID: ${id})`
        });
        await product.destroy();
        return res.status(200).json({ message: "Produto deletado com sucesso" });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao deletar produto";
        return res.status(500).json({ message });
    }
};
exports.deleteProduct = deleteProduct;
