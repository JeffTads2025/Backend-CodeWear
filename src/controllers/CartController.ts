import { Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import { AuthRequest } from '../types';

export const addToCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { productId, quantity = 1, size = 'M' } = req.body;
        const userId = req.user!.id;

        // 1. Busca o produto para verificar se ele existe e ver o estoque real
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        // 2. Procura se já existe esse item com esse tamanho específico no carrinho
        let item = await Cart.findOne({ where: { userId, productId, size } });

        if (item) {
            // VALIDAÇÃO DE ESTOQUE: Verifica se a soma ultrapassa o estoque real
            if (product.stock < (item.quantity + quantity)) {
                return res.status(400).json({ 
                    message: `Estoque insuficiente. Você já tem ${item.quantity} un. no carrinho e o estoque total é ${product.stock}.` 
                });
            }

            item.quantity += quantity;
            await item.save();
            return res.status(200).json(item);
        }

        // 3. Se for um item novo, verifica se a quantidade inicial não supera o estoque
        if (product.stock < quantity) {
            return res.status(400).json({ message: "Quantidade solicitada superior ao estoque disponível." });
        }

        // Cria o registro com a nova coluna 'size'
        const newItem = await Cart.create({ userId, productId, quantity, size });
        return res.status(201).json(newItem);

    } catch (error) {
        console.error("Erro no Backend:", error);
        return res.status(500).json({ message: "Erro interno ao salvar no banco" });
    }
};

export const listCart = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user!.id;
        const items = await Cart.findAll({
            where: { userId },
            include: [{ 
                model: Product,
                attributes: ['id', 'name', 'price', 'image_url', 'stock'] // Garante que o front receba o estoque atualizado
            }],
            order: [['createdAt', 'ASC']]
        });
        return res.status(200).json(items);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar carrinho" });
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