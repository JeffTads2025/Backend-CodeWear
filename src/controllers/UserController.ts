import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Adicionado para gerar o token de segurança
import User from '../models/UserModel';

// Função para Cadastrar Usuário
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, cpf } = req.body;

        if (!name || !email || !password || !cpf) {
            return res.status(400).json({ message: "Dados incompletos" });
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        const newUser = await User.create({ name, email, password: hashedPassword, cpf });

        return res.status(201).json({ message: "Usuário criado!", id: newUser.id });
    } catch (error) {
        return res.status(500).json({ message: "Erro no servidor", error });
    }
};

// Função para Login (Exigência da Rubrica)
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Busca o usuário pelo e-mail
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }

        // 2. Compara a senha digitada com a criptografada
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }

        // 3. Gera o Token JWT para o usuário logar
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'chave_secreta_padrao',
            { expiresIn: '1d' } // O token vale por 1 dia
        );

        return res.status(200).json({ 
            message: "Login realizado com sucesso!", 
            token,
            user: { name: user.name, email: user.email } 
        });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao processar o login.", error });
    }
};