"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItem = exports.updateCartItem = exports.listCart = exports.addToCart = void 0;
const CartModel_1 = __importDefault(require("../models/CartModel"));
const ProductModel_1 = __importDefault(require("../models/ProductModel"));
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user.id;
        const product = await ProductModel_1.default.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }
        let item = await CartModel_1.default.findOne({ where: { userId, productId } });
        if (item) {
            if (product.stock < (item.quantity + quantity)) {
                return res.status(400).json({
                    message: `Estoque insuficiente. Você já tem ${item.quantity} un. no carrinho e o estoque total é ${product.stock}.`
                });
            }
            item.quantity += quantity;
            await item.save();
            return res.status(200).json(item);
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Quantidade solicitada superior ao estoque disponível." });
        }
        const newItem = await CartModel_1.default.create({ userId, productId, quantity });
        return res.status(201).json(newItem);
    }
    catch (error) {
        console.error("Erro no Backend:", error);
        return res.status(500).json({ message: "Erro interno ao salvar no banco" });
    }
};
exports.addToCart = addToCart;
const listCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        if (limit > 0) {
            const offset = (page - 1) * limit;
            const { count, rows } = await CartModel_1.default.findAndCountAll({
                where: { userId },
                limit,
                offset,
                include: [{
                        model: ProductModel_1.default,
                        attributes: ['id', 'name', 'price', 'image_url', 'stock']
                    }],
                order: [['createdAt', 'ASC']]
            });
            return res.status(200).json({
                items: rows,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalItems: count
            });
        }
        const items = await CartModel_1.default.findAll({
            where: { userId },
            include: [{
                    model: ProductModel_1.default,
                    attributes: ['id', 'name', 'price', 'image_url', 'stock'] // Garante que o front receba o estoque atualizado
                }],
            order: [['createdAt', 'ASC']]
        });
        return res.status(200).json(items);
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao listar carrinho" });
    }
};
exports.listCart = listCart;
const updateCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;
        if (typeof quantity !== 'number' || quantity < 1) {
            return res.status(400).json({ message: "Quantidade deve ser maior que zero" });
        }
        const item = await CartModel_1.default.findOne({ where: { id, userId } });
        if (!item) {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }
        const product = await ProductModel_1.default.findByPk(item.productId);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Quantidade solicitada superior ao estoque disponível." });
        }
        item.quantity = quantity;
        await item.save();
        return res.status(200).json(item);
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar item do carrinho" });
    }
};
exports.updateCartItem = updateCartItem;
const removeItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const deleted = await CartModel_1.default.destroy({ where: { id, userId } });
        if (!deleted) {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }
        return res.status(200).json({ message: "Item removido" });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao remover" });
    }
};
exports.removeItem = removeItem;
