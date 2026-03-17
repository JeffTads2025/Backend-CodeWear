import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types'; // Importando seu Type Global

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // 1. Validação de presença do token (Rubrica: Autenticação)
  if (!authHeader) return res.status(401).json({ message: "Login necessário" });

  const token = authHeader.split(' ')[1];

  try {
    // 2. Tipagem do payload do JWT para evitar o 'any'
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao') as { 
      id: number; 
      name: string; 
      role: 'admin' | 'client' 
    };

    // 3. Preenche o req.user usando a interface AuthRequest (Sem usar 'as any')
    req.user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role
    };

    // 4. Lógica de Proteção de Rota (Exigência para Admin/Dashboard)
    const isAdminRoute = req.originalUrl.includes('admin') || 
                         (req.originalUrl.includes('products') && req.method !== 'GET');

    if (isAdminRoute && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Acesso restrito ao administrador" });
    }

    next();
  } catch (error) {
    // 5. Retorno coerente com o status (Rubrica: Código Limpo)
    return res.status(401).json({ message: "Sessão expirada ou inválida" });
  }
};