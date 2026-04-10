import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import User from '../models/UserModel';
import { isCancelledEmail } from '../utils/accountCancellation';

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // LOG PARA DEBUG: Verifique o terminal do seu Node
  if (!authHeader) {
    console.log("ALERTA: Requisição sem header de autorização.");
    return res.status(401).json({ message: "Login necessário" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao') as { 
      id: number; 
      name: string; 
      role: 'admin' | 'client' 
    };

    const currentUser = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'role', 'email']
    });

    if (!currentUser || isCancelledEmail(currentUser.email)) {
      return res.status(401).json({ message: 'Conta cancelada ou indisponível' });
    }

    req.user = {
      id: currentUser.id,
      name: currentUser.name,
      role: currentUser.role
    };

    // Proteção de rotas administrativas
    const isAdminRoute = req.originalUrl.includes('admin') || 
                         (req.originalUrl.includes('products') && req.method !== 'GET');

    if (isAdminRoute && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Acesso restrito ao administrador" });
    }

    next();
  } catch (error) {
    console.log("ERRO JWT:", error);
    return res.status(401).json({ message: "Sessão expirada ou inválida" });
  }
};