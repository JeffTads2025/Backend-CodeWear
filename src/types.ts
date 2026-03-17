import { Request } from 'express';

// Interface global para requisições que precisam de usuário logado
export interface AuthRequest extends Request {
    user?: {
        id: number;
        name: string;
        role: 'admin' | 'client';
    };
}

// Interface para mensagens de erro/sucesso (opcional, mas ajuda a padronizar)
export interface ApiResponse {
    message: string;
    error?: any;
    data?: any;
}