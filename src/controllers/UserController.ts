import { Response, Request } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op, fn, col, where } from 'sequelize'; 
import User from '../models/UserModel';
import { validateEmail, validateCPF, validatePasswordLevel } from '../utils/validators';
import { AuthRequest } from '../types';

/**
 * CADASTRO DE USUÁRIO
 */
export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, cpf, phone, address } = req.body;

        if (!name || !email || !password || !cpf || !phone || !address) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios." });
        }

        const cleanEmail = email.toLowerCase().trim();
        const cleanCPF = cpf.replace(/\D/g, ''); 

        if (!validateEmail(cleanEmail)) return res.status(400).json({ message: "Formato de e-mail inválido." });
        if (!validateCPF(cleanCPF)) return res.status(400).json({ message: "CPF inválido." });
        if (!validatePasswordLevel(password)) return res.status(400).json({ message: "Senha muito fraca." });

        const userExists = await User.findOne({ where: { email: cleanEmail } });
        if (userExists) return res.status(400).json({ message: "Este e-mail já está em uso." });

        const newUser = await User.create({
            name,
            email: cleanEmail,
            password,
            cpf: cleanCPF, 
            phone,
            address,
            role: 'client' 
        });

        return res.status(201).json({ message: "Usuário criado com sucesso!", id: newUser.id });

    } catch (error: any) {
        console.error("ERRO NO CADASTRO:", error);
        return res.status(500).json({ message: "Erro interno ao criar usuário." });
    }
};

/**
 * LOGIN DE USUÁRIO
 */
export const loginUser = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ where: { email: cleanEmail } });

        if (!user) return res.status(401).json({ message: "E-mail não encontrado." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Senha incorreta." });

        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET || 'uma_chave_segura_aqui',
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: "Login realizado!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao processar o login." });
    }
};

/**
 * OBTER DADOS DO USUÁRIO LOGADO
 */
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Não autorizado." });

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] } 
        });

        if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar dados do perfil." });
    }
};

/**
 * ATUALIZAR PERFIL
 */
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Não autorizado." });

        const { name, password, phone, address } = req.body;
        const user = await User.findByPk(userId);
        
        if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

        const updateData: any = { name, phone, address };

        if (password) {
            updateData.password = password; 
        }

        await user.update(updateData);
        return res.status(200).json({ message: "Perfil atualizado com sucesso!" });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar o perfil." });
    }
};

/**
 * LISTAR CLIENTES (Admin)
 * ALTERAÇÃO: Agora aceita 'limit' via query para permitir exportação total.
 */
export const listUsersAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const search = (req.query.search as string) || ''; 
        
        // Dinâmico: Se o front enviar limit=9999, usamos. Se não, padrão é 5.
        const queryLimit = parseInt(req.query.limit as string);
        const limit = isNaN(queryLimit) ? 5 : queryLimit; 

        const offset = (page - 1) * limit;

        // Conta o total absoluto de clientes no banco
        const totalCountInDB = await User.count({ where: { role: 'client' } });

        const whereClause: any = { role: 'client' };

        if (search) {
            const searchLower = `%${search.toLowerCase()}%`;
            
            whereClause[Op.or] = [
                where(fn('lower', col('name')), { [Op.like]: searchLower }),
                where(fn('lower', col('email')), { [Op.like]: searchLower }),
                where(fn('lower', col('cpf')), { [Op.like]: searchLower })
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            attributes: ['id', 'name', 'email', 'cpf', 'address', 'createdAt', 'phone'], 
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            users: rows,
            totalPages: Math.ceil(count / limit),
            totalCount: totalCountInDB 
        });
    } catch (error) {
        console.error("Erro ao listar clientes:", error);
        return res.status(500).json({ message: "Erro ao listar clientes no banco." });
    }
};

/**
 * ESTATÍSTICAS DO DASHBOARD (Admin)
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const totalClients = await User.count({ 
            where: { role: 'client' } 
        });

        return res.status(200).json({
            totalClients
        });
    } catch (error) {
        console.error("Erro ao carregar estatísticas do dashboard:", error);
        return res.status(500).json({ message: "Erro interno ao processar estatísticas." });
    }
};