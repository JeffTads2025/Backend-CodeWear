import { Request } from 'express';

// Interface global para requisições que precisam de usuário logado
export interface AuthRequest extends Request {
    user?: {
        id: number;
        name: string;
        role: 'admin' | 'client';
    };
}

// Interface para mensagens de erro/sucesso 
export interface ApiResponse<TData = undefined, TError = string | undefined> {
    message: string;
    error?: TError;
    data?: TData;
}