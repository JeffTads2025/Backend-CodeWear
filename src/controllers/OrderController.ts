import { Request, Response } from 'express';
import Cart from '../models/CartModel';
import Product from '../models/ProductModel';
import Order from '../models/OrderModel';
import OrderItem from '../models/OrderItemModel';
import User from '../models/UserModel'; // 1. SUBSTITUIÇÃO: Adicione esta linha
import sequelize from '../config/database';

export const checkout = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.id;
        const { paymentMethod, address } = req.body;

        // 1. Busca os itens do carrinho
        const cartItems = await (Cart as any).findAll({
            where: { userId },
            include: [{ model: Product }]
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ message: "Seu carrinho está vazio" });
        }

        // 2. SUBSTITUIÇÃO: Busca dados do usuário para pegar telefone/endereço padrão
        const user = await (User as any).findByPk(userId);
        
        // Se não vier endereço no req.body, usa o do cadastro. Se não tiver nenhum, dá erro.
        const finalAddress = address || user.address;

        if (!finalAddress) {
            return res.status(400).json({ message: "Endereço de entrega não informado." });
        }

        // 2. Calcula o valor total do pedido
        let totalValue = 0;
        cartItems.forEach((item: any) => {
            totalValue += item.quantity * item.Product.price;
        });

        // 3. SUBSTITUIÇÃO: Cria o Pedido usando o endereço final validado
        const order = await (Order as any).create({
            userId,
            totalValue,
            paymentMethod,
            address: finalAddress, // Usa o endereço que definimos acima
            status: 'pago'
        }, { transaction: t });

        // 4. Move itens para OrderItems e limpa o carrinho
        for (const item of cartItems) {
            await (OrderItem as any).create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.Product.price
            }, { transaction: t });
        }

        // 5. Esvazia o carrinho do banco de dados
        await (Cart as any).destroy({ where: { userId }, transaction: t });

        await t.commit();
        return res.status(201).json({ 
            message: "Pedido finalizado com sucesso!", 
            orderId: order.id,
            total: totalValue 
        });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({ message: "Erro ao finalizar pedido", error });
    }
};

// Função para o cliente ver o histórico de pedidos dele
export const listMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const orders = await (Order as any).findAll({
            where: { userId },
            include: [{ model: OrderItem, include: [Product] }]
        });
        return res.status(200).json(orders);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao listar pedidos", error });
    }
};