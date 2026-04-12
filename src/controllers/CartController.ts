import { Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import { AuthRequest } from '../types';

export const addToCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user!.id;

        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        let item = await Cart.findOne({ where: { userId, productId } });

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

        const newItem = await Cart.create({ userId, productId, quantity });
        return res.status(201).json(newItem);

    } catch (error) {
        console.error("Erro no Backend:", error);
        return res.status(500).json({ message: "Erro interno ao salvar no banco" });
    }
};

export const listCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 0;

        if (limit > 0) {
            const offset = (page - 1) * limit;
            const { count, rows } = await Cart.findAndCountAll({
                where: { userId },
                limit,
                offset,
                include: [{
                    model: Product,
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

        const items = await Cart.findAll({
            where: { userId },
            include: [{
                model: Product,
                attributes: ['id', 'name', 'price', 'image_url', 'stock'] 
            }],
            order: [['createdAt', 'ASC']]
        });
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar carrinho" });
    }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.user!.id;

        if (typeof quantity !== 'number' || quantity < 1) {
            return res.status(400).json({ message: "Quantidade deve ser maior que zero" });
        }

        const item = await Cart.findOne({ where: { id, userId } });

        if (!item) {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }

        const product = await Product.findByPk(item.productId);

        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        if (product.stock < quantity) {
            return res.status(400).json({ message: "Quantidade solicitada superior ao estoque disponível." });
        }

        item.quantity = quantity;
        await item.save();

        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar item do carrinho" });
    }
};

export const removeItem = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const deleted = await Cart.destroy({ where: { id, userId } });

        if (!deleted) {
            return res.status(404).json({ message: "Item não encontrado no carrinho" });
        }

        return res.status(200).json({ message: "Item removido" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao remover" });
    }
};