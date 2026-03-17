import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel';
import { validateEmail, validateCPF, validatePasswordLevel } from '../utils/validators';
import { AuthRequest } from '../types';

export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, cpf } = req.body;

        if (!name || !email || !password || !cpf) {
            return res.status(400).json({ message: "Dados incompletos." });
        }

        if (!validateEmail(email)) return res.status(400).json({ message: "E-mail inválido." });
        if (!validateCPF(cpf)) return res.status(400).json({ message: "CPF inválido." });
        if (!validatePasswordLevel(password)) return res.status(400).json({ message: "Senha fraca." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, email, password: hashedPassword, cpf });

        return res.status(201).json({ message: "Usuário criado!", id: newUser.id });
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "E-mail ou CPF já cadastrados." });
        }
        return res.status(500).json({ message: "Erro ao criar usuário." });
    }
};

export const loginUser = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "E-mail ou senha incorretos." });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.get('role') }, // Corrigido aqui (usando .get)
            process.env.JWT_SECRET || 'chave_secreta_padrao',
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Login realizado!",
            token,
            user: { name: user.name, email: user.email, role: user.get('role') } // Corrigido aqui também
        });
    } catch (error: unknown) {
        return res.status(500).json({ message: "Erro ao processar o login." });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Não autorizado." });

        const { name, password, cpf, phone, address } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

        if (req.body.email) return res.status(400).json({ message: "A alteração de e-mail não é permitida." });
        if (cpf && !validateCPF(cpf)) return res.status(400).json({ message: "CPF inválido." });

        const updateData: {
            name?: string; cpf?: string; phone?: string; address?: string; password?: string
        } = { name, cpf, phone, address };

        if (password) {
            if (!validatePasswordLevel(password)) return res.status(400).json({ message: "Nova senha muito fraca." });
            updateData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);
        return res.status(200).json({ message: "Perfil atualizado!" });
    } catch (error: unknown) {
        return res.status(500).json({ message: "Erro ao atualizar o perfil." });
    }
};