import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 1. Verifica se o Token é válido usando a mesma chave do Login
        // Alterado para bater com process.env.JWT_SECRET || 'chave_secreta_padrao'
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao'); 
        
        // 2. Busca o usuário no banco
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        // 3. ANEXA o usuário na requisição (Essencial para o Carrinho!)
        (req as any).user = user;

        // 4. Se a rota for de Admin (POST, PUT, DELETE em produtos), verifica o cargo
        // Verificamos se a URL contém 'products' e se o método não é 'GET'
        const isProductAdminRoute = req.originalUrl.includes('products') && req.method !== 'GET';

        if (isProductAdminRoute && (user as any).role !== 'admin') {
            return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
};