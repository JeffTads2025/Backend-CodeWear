import { Response } from 'express';
import Product from '../models/ProductModel';
import AuditLog from '../models/AuditLogModel';
import { AuthRequest } from '../types';

// Função auxiliar mantida (Excelente prática!)
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

        // Filtro por categoria (Funciona para 'Unissex' ou qualquer outra que você definir)
        const whereClause: any = {};
        if (req.query.category) whereClause.category = req.query.category;

        const { count, rows } = await Product.findAndCountAll({
            where: whereClause,
            limit,
            offset: (page - 1) * limit,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ 
            products: rows, 
            totalPages: Math.ceil(count / limit), 
            currentPage: page 
        });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar produtos" });
    }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        // 1. Adicionamos 'sizes' na desestruturação
        const { name, price, description, category, stock, image_url, sizes } = req.body;

        // 2. Validação para a grade unissex (Rubrica: Tratamento de entradas)
        if (!name || !price || !sizes) {
            return res.status(400).json({ message: "Nome, preço e grade de tamanhos são obrigatórios" });
        }

        const product = await Product.create({ 
            name, 
            price, 
            description, 
            category: category || 'Unissex', 
            stock, 
            image_url, 
            sizes // Salvando a string "P,M,G" no banco
        });

        await registerLog(req, 'CRIAÇÃO', `Camiseta ${name} criada com tamanhos: ${sizes}`);
        return res.status(201).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto" });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const product = await Product.findByPk(parseInt(id));
        if (!product) return res.status(404).json({ message: "Recurso não existe" });

        const oldDetails = `Preço: ${product.price}, Grade: ${product.sizes}`;
        
        // O Sequelize atualizará apenas os campos enviados no req.body (incluindo o novo 'sizes')
        await product.update(req.body);

        await registerLog(req, `ATUALIZOU: ${product.name}`, `De: [${oldDetails}] Para: [Preço: ${product.price}, Grade: ${product.sizes}]`);
        return res.status(200).json(product);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar" });
    }
};

// deleteProduct permanece igual, pois ele já remove o objeto completo do banco.
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