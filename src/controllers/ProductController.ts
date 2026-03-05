import { Request, Response } from 'express';
import Product from '../models/ProductModel';

// LISTAR (Read) - Busca todos os produtos para a vitrine
export const listProducts = async (req: Request, res: Response): Promise<Response> => {
    try {
        const products = await (Product as any).findAll();
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar produtos", error });
    }
};

// CRIAR (Create) - Adiciona um novo produto ao estoque
export const createProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { name, price, description, stock } = req.body;

        if (!name || !price) {
            return res.status(400).json({ message: "Nome e preço são obrigatórios" });
        }

        const newProduct = await (Product as any).create({ name, price, description, stock });
        return res.status(201).json(newProduct);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao criar produto", error });
    }
};

// EDITAR (Update) - Altera dados de um produto existente
export const updateProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, price, description, stock } = req.body;

        const product = await (Product as any).findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        await product.update({ name, price, description, stock });
        return res.status(200).json({ message: "Produto atualizado!", product });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar produto", error });
    }
};

// DELETAR (Delete) - Remove um produto do banco de dados
export const deleteProduct = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const product = await (Product as any).findByPk(id);

        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
        }

        await product.destroy();
        return res.status(200).json({ message: "Produto removido com sucesso!" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao deletar produto", error });
    }
};