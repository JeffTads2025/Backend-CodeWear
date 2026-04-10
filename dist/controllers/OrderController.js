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
const database_1 = __importDefault(require("../config/database"));
const accountCancellation_1 = require("../utils/accountCancellation");
// 1. FINALIZAR COMPRA (CHECKOUT) - MANTIDO ORIGINAL
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
        const itemsToOrder = [];
        for (const item of cartItems) {
            const product = await ProductModel_1.default.findByPk(item.productId, { transaction: t });
            if (!product)
                throw new Error(`Produto ${item.productId} não encontrado`);
            if (product.stock < item.quantity)
                throw new Error(`Estoque insuficiente: ${product.name}`);
            totalValue += item.quantity * product.price;
            itemsToOrder.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            });
        }
        const order = await OrderModel_1.default.create({
            userId,
            totalValue,
            paymentMethod,
            address: finalAddress,
            status: 'pago'
        }, { transaction: t });
        for (const item of itemsToOrder) {
            await OrderItemModel_1.default.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.price
            }, { transaction: t });
            await ProductModel_1.default.decrement('stock', {
                by: item.quantity,
                where: { id: item.productId },
                transaction: t
            });
        }
        await CartModel_1.default.destroy({ where: { userId }, transaction: t });
        await t.commit();
        return res.status(201).json({ message: "Compra finalizada!", orderId: order.id });
    }
    catch (error) {
        await t.rollback();
        return res.status(400).json({ message: error.message || 'Erro no checkout' });
    }
};
exports.checkout = checkout;
// 2. LISTAR PEDIDOS DO USUÁRIO LOGADO - MANTIDO ORIGINAL
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
// 3. ADMIN: LISTAR TODOS OS PEDIDOS (ADICIONADO FILTRO DE MÊS PARA EXCEL)
const listAllOrdersAdmin = async (req, res) => {
    try {
        const { page, date, month, year, limit: queryLimit } = req.query;
        const limit = queryLimit ? Number(queryLimit) : 5;
        const offset = page ? (Number(page) - 1) * limit : 0;
        const whereClause = {};
        if (date) {
            whereClause.createdAt = {
                [sequelize_1.Op.between]: [
                    new Date(`${date} 00:00:00`),
                    new Date(`${date} 23:59:59`)
                ]
            };
        }
        // Se não tem data específica, mas tem mês/ano (Exportação Mensal)
        else if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            whereClause.createdAt = { [sequelize_1.Op.between]: [startDate, endDate] };
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
// 4. ADMIN: DASHBOARD (CORRIGIDO PARA SEPARAR GERAL DE MENSAL)
const getAdminDashboard = async (req, res) => {
    try {
        const { month, year } = req.query;
        // Faturamento de todo o tempo (Soma total histórica)
        const totalRevenue = await OrderModel_1.default.sum('totalValue') || 0;
        const totalOrders = await OrderModel_1.default.count() || 0;
        const totalUsers = await UserModel_1.default.count({ where: (0, accountCancellation_1.getActiveClientWhereClause)() }) || 0;
        // Cálculo específico do mês para o card "VENDAS NO MÊS"
        let monthlyRevenue = 0;
        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            monthlyRevenue = await OrderModel_1.default.sum('totalValue', {
                where: {
                    createdAt: { [sequelize_1.Op.between]: [startDate, endDate] }
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
    }
    catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        return res.status(500).json({ message: "Erro no dashboard" });
    }
};
exports.getAdminDashboard = getAdminDashboard;
// 5. ADMIN: LISTAR PRODUTOS - MANTIDO ORIGINAL
const listProducts = async (req, res) => {
    try {
        const products = await ProductModel_1.default.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json(products);
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao listar produtos" });
    }
};
exports.listProducts = listProducts;
// 6. ADMIN: CRIAR PRODUTO - MANTIDO ORIGINAL
const createProduct = async (req, res) => {
    try {
        const { name, price, stock, image_url } = req.body;
        const product = await ProductModel_1.default.create({ name, price, stock, image_url });
        return res.status(201).json({ message: "Produto criado com sucesso!", product });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto" });
    }
};
exports.createProduct = createProduct;
// 7. ADMIN: ATUALIZAR PRODUTO - MANTIDO ORIGINAL
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel_1.default.findByPk(id);
        if (!product)
            return res.status(404).json({ message: "Produto não encontrado" });
        await product.update(req.body);
        return res.status(200).json({ message: "Atualizado com sucesso!", product });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar" });
    }
};
exports.updateProduct = updateProduct;
// 8. ADMIN: DELETAR PRODUTO - MANTIDO ORIGINAL
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel_1.default.findByPk(id);
        if (!product)
            return res.status(404).json({ message: "Produto não encontrado" });
        await product.destroy();
        return res.status(200).json({ message: "Produto deletado com sucesso! 🗑️" });
    }
    catch (error) {
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
exports.deleteProduct = deleteProduct;
