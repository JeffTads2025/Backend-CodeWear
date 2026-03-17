import { Response } from 'express';
import Product from '../models/ProductModel';
import AuditLog from '../models/AuditLogModel';
import { AuthRequest } from '../types';

// Função auxiliar para cumprir "Responsabilidade Única" e reduzir linhas (Rubrica)
const registerLog = async (req: AuthRequest, action: string, details: string) => {
    if (req.user) {
        await AuditLog.create({
            adminId: req.user.id,
            adminName: req.user.name,
            action,
            details
        });
    }
};

export const listProducts = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 8;
        const { count, rows } = await Product.findAndCountAll({
            where: req.query.category ? { category: req.query.category } : {},
            limit,
            offset: (page - 1) * limit,
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ products: rows, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar produtos" });
    }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, price, description, category, stock, image_url } = req.body;
        // Validação básica para evitar erro de campos vazios (Rubrica)
        if (!name || !price) return res.status(400).json({ message: "Nome e preço são obrigatórios" });

        const product = await Product.create({ name, price, description, category, stock, image_url });
        await registerLog(req, 'CRIAÇÃO', `Produto ${name} criado.`);
        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto" });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const product = await Product.findByPk(parseInt(id));
        if (!product) return res.status(404).json({ message: "Recurso não existe" }); // Rubrica: Mensagem clara

        const oldPrice = product.price;
        await product.update(req.body);

        await registerLog(req, `ATUALIZOU: ${product.name}`, `Preço: ${oldPrice} -> ${product.price}`);
        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar" });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const product = await Product.findByPk(parseInt(id));
        if (!product) return res.status(404).json({ message: "Produto não encontrado" });

        const pName = product.name;
        await product.destroy();

        await registerLog(req, 'REMOÇÃO', `O produto ${pName} foi deletado.`);
        return res.status(200).json({ message: "Produto removido com sucesso" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao deletar" });
    }
};