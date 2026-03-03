import { Request, Response } from 'express';
import Product from '../models/ProductModel'; // Importa o Model que criamos

export const listProducts = async (req: Request, res: Response) => {
    try {
        const products = await Product.findAll(); // Busca todos os produtos
        return res.status(200).json(products);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar produtos", error });
    }
};