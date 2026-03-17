import { Request, Response } from 'express';
import Product from '../models/ProductModel';
import AuditLog from '../models/AuditLogModel'; // Importação necessária para os logs

export const listProducts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 8;
        const offset = (page - 1) * limit;
        const { category } = req.query;

        const whereCondition = category ? { category } : {};

        const { count, rows } = await (Product as any).findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            products: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar produtos", error });
    }
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        // Acrescentado image_url aqui
        const { name, price, description, category, stock, image_url } = req.body;
        const product = await Product.create({ name, price, description, category, stock, image_url });
        
        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto" });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params['id'] as string, 10);
        const admin = (req as any).user; // Pega o admin logado pelo Token
        const product = await Product.findByPk(id);

        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        const oldPrice = product.price; // Guarda o preço antigo para o log
        await product.update(req.body);

        // --- REGISTRO DE AUDITORIA ---
        await AuditLog.create({
            adminId: admin.id,
            adminName: admin.name,
            action: `ATUALIZOU PRODUTO: ${product.name}`,
            details: `Preço antigo: ${oldPrice} | Novo preço: ${product.price}`
        });

        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar" });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params['id'] as string, 10);
        const admin = (req as any).user;
        const product = await Product.findByPk(id);

        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        const productName = product.name;
        await product.destroy();

        // --- REGISTRO DE AUDITORIA ---
        await AuditLog.create({
            adminId: admin.id,
            adminName: admin.name,
            action: `REMOVEU PRODUTO`,
            details: `O administrador removeu o produto: ${productName}`
        });

        return res.status(200).json({ message: "Produto removido" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao deletar" });
    }
};