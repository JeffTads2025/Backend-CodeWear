import { Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import { AuthRequest } from '../types';

// 1. ADICIONAR OU INCREMENTAR ITEM
export const addToCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user!.id;

        const product = await Product.findByPk(productId);
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        let item = await Cart.findOne({ where: { userId, productId } });
        if (item) {
            item.quantity += quantity;
            await item.save();
            return res.status(200).json(item);
        }

        item = await Cart.create({ userId, productId, quantity });
        return res.status(201).json(item);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao adicionar ao carrinho" });
    }
};

// 2. LISTAR ITENS DO CARRINHO (Com dados do Produto)
export const listCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user!.id;
        const items = await Cart.findAll({
            where: { userId },
            include: [{ model: Product }]
        });
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar carrinho" });
    }
};

// 3. REMOVER UM ITEM ESPECÍFICO (DELETE)
export const removeItem = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        let id: string;
        if (Array.isArray(req.params.id)) {
            id = req.params.id[0];
        } else {
            id = req.params.id;
        }
        const userId = req.user!.id;
        const deleted = await Cart.destroy({ where: { id: parseInt(id), userId } });
        if (!deleted) return res.status(404).json({ message: "Item não encontrado no seu carrinho" });
        return res.status(200).json({ message: "Item removido com sucesso!" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao remover item" });
    }
};

// 4. ESVAZIAR CARRINHO (Útil após finalizar pedido)
export const clearCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user!.id;
        await Cart.destroy({ where: { userId } });
        return res.status(200).json({ message: "Carrinho esvaziado!" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao limpar carrinho" });
    }
};