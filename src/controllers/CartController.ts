import { Request, Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';

// 1. ADICIONAR OU INCREMENTAR ITEM
export const addToCart = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { productId, quantity } = req.body;
        const userId = (req as any).user.id; // Extraído do Token pelo authMiddleware

        const product = await (Product as any).findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        const existingItem = await (Cart as any).findOne({
            where: { userId, productId }
        });

        if (existingItem) {
            existingItem.quantity += (quantity || 1);
            await existingItem.save();
            return res.status(200).json(existingItem);
        }

        const cartItem = await (Cart as any).create({
            userId,
            productId,
            quantity: quantity || 1
        });

        return res.status(201).json(cartItem);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao adicionar ao carrinho", error });
    }
};

// 2. LISTAR ITENS DO CARRINHO (Com dados do Produto)
export const listCart = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userId = (req as any).user.id; 
        
        const items = await (Cart as any).findAll({
            where: { userId },
            include: [{ model: Product }] // JOIN necessário para ver o que está comprando
        });
        
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar carrinho", error });
    }
};

// 3. REMOVER UM ITEM ESPECÍFICO (DELETE)
export const removeItem = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params; // ID do registro na tabela 'carts'
        const userId = (req as any).user.id;

        const deleted = await (Cart as any).destroy({
            where: { id, userId } // Garante que o usuário só delete o próprio item
        });

        if (!deleted) {
            return res.status(404).json({ message: "Item não encontrado no seu carrinho" });
        }

        return res.status(200).json({ message: "Item removido com sucesso!" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao remover item", error });
    }
};

// 4. ESVAZIAR CARRINHO (Útil após finalizar pedido)
export const clearCart = async (req: Request, res: Response): Promise<Response> => {
    try {
        const userId = (req as any).user.id;

        await (Cart as any).destroy({
            where: { userId }
        });

        return res.status(200).json({ message: "Carrinho esvaziado!" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao limpar carrinho", error });
    }
};