"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.listUsersAdmin = exports.cancelMyAccount = exports.updateUser = exports.getMe = exports.loginUser = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sequelize_1 = require("sequelize");
const UserModel_1 = __importDefault(require("../models/UserModel"));
const accountCancellation_1 = require("../utils/accountCancellation");
const validators_1 = require("../utils/validators");
/**
 * CADASTRO DE USUÁRIO
 */
const createUser = async (req, res) => {
    try {
        const { name, email, password, cpf, phone, address } = req.body;
        if (!name || !email || !password || !cpf || !phone || !address) {
            return res.status(400).json({ message: "Todos os campos são obrigatórios." });
        }
        const cleanEmail = email.toLowerCase().trim();
        const cleanCPF = cpf.replace(/\D/g, '');
        const cleanPassword = password.trim();
        if (!(0, validators_1.validateEmail)(cleanEmail))
            return res.status(400).json({ message: "Formato de e-mail inválido." });
        if (!(0, validators_1.validateCPF)(cleanCPF))
            return res.status(400).json({ message: "CPF inválido." });
        if (!(0, validators_1.validatePasswordLevel)(cleanPassword))
            return res.status(400).json({ message: "Senha muito fraca." });
        const userExists = await UserModel_1.default.findOne({ where: { email: cleanEmail } });
        if (userExists)
            return res.status(400).json({ message: "Este e-mail já está em uso." });
        const newUser = await UserModel_1.default.create({
            name,
            email: cleanEmail,
            password: cleanPassword,
            cpf: cleanCPF,
            phone,
            address,
            role: 'client'
        });
        return res.status(201).json({ message: "Usuário criado com sucesso!", id: newUser.id });
    }
    catch (error) {
        console.error("ERRO NO CADASTRO:", error);
        return res.status(500).json({ message: "Erro interno ao criar usuário." });
    }
};
exports.createUser = createUser;
/**
 * LOGIN DE USUÁRIO
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const cleanEmail = email.toLowerCase().trim();
        const rawPassword = String(password || '');
        const cleanPassword = rawPassword.trim();
        const user = await UserModel_1.default.findOne({ where: { email: cleanEmail } });
        if (!user)
            return res.status(401).json({ message: "E-mail não encontrado." });
        if ((0, accountCancellation_1.isCancelledEmail)(user.email))
            return res.status(403).json({ message: "Esta conta foi cancelada." });
        let isMatch = await bcrypt_1.default.compare(rawPassword, user.password);
        if (!isMatch && cleanPassword !== rawPassword) {
            isMatch = await bcrypt_1.default.compare(cleanPassword, user.password);
        }
        if (!isMatch)
            return res.status(401).json({ message: "Senha incorreta." });
        const token = jsonwebtoken_1.default.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET || 'uma_chave_segura_aqui', { expiresIn: '1d' });
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
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao processar o login." });
    }
};
exports.loginUser = loginUser;
/**
 * OBTER DADOS DO USUÁRIO LOGADO
 */
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Não autorizado." });
        const user = await UserModel_1.default.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado." });
        if ((0, accountCancellation_1.isCancelledEmail)(user.email))
            return res.status(404).json({ message: "Usuário não encontrado." });
        return res.status(200).json(user);
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao buscar dados do perfil." });
    }
};
exports.getMe = getMe;
/**
 * ATUALIZAR PERFIL
 */
const updateUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Não autorizado." });
        const { name, password, phone, address, cpf } = req.body;
        const user = await UserModel_1.default.findByPk(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado." });
        if ((0, accountCancellation_1.isCancelledEmail)(user.email))
            return res.status(404).json({ message: "Usuário não encontrado." });
        const updateData = { name, phone, address };
        if (cpf) {
            updateData.cpf = cpf.replace(/\D/g, ''); // Limpa o CPF
        }
        if (password) {
            const cleanPassword = password.trim();
            if (!(0, validators_1.validatePasswordLevel)(cleanPassword)) {
                return res.status(400).json({ message: "Senha muito fraca." });
            }
            updateData.password = cleanPassword;
        }
        await user.update(updateData);
        return res.status(200).json({ message: "Perfil atualizado com sucesso!" });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao atualizar o perfil." });
    }
};
exports.updateUser = updateUser;
/**
 * CANCELAR CONTA DO USUÁRIO LOGADO
 */
const cancelMyAccount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Não autorizado." });
        const user = await UserModel_1.default.findByPk(userId);
        if (!user)
            return res.status(404).json({ message: "Usuário não encontrado." });
        if ((0, accountCancellation_1.isCancelledEmail)(user.email)) {
            return res.status(400).json({ message: "Esta conta já foi cancelada." });
        }
        await user.update((0, accountCancellation_1.buildCancelledAccountData)(user));
        return res.status(200).json({ message: "Conta cancelada com sucesso." });
    }
    catch (error) {
        console.error('Erro ao cancelar conta:', error);
        return res.status(500).json({ message: "Erro ao cancelar conta." });
    }
};
exports.cancelMyAccount = cancelMyAccount;
/**
 * LISTAR CLIENTES (Admin)
 * ALTERAÇÃO: Agora aceita 'limit' via query para permitir exportação total.
 */
const listUsersAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        // Dinâmico: Se o front enviar limit=9999, usamos. Se não, padrão é 5.
        const queryLimit = parseInt(req.query.limit);
        const limit = isNaN(queryLimit) ? 5 : queryLimit;
        const offset = (page - 1) * limit;
        // Conta o total absoluto de clientes no banco
        const activeClientWhereClause = (0, accountCancellation_1.getActiveClientWhereClause)();
        const totalCountInDB = await UserModel_1.default.count({ where: activeClientWhereClause });
        const whereClause = search
            ? {
                role: 'client',
                email: {
                    [sequelize_1.Op.notLike]: `%${accountCancellation_1.CANCELLED_EMAIL_DOMAIN}`,
                },
                [sequelize_1.Op.or]: [
                    (0, sequelize_1.where)((0, sequelize_1.fn)('lower', (0, sequelize_1.col)('name')), { [sequelize_1.Op.like]: `%${search.toLowerCase()}%` }),
                    (0, sequelize_1.where)((0, sequelize_1.fn)('lower', (0, sequelize_1.col)('email')), { [sequelize_1.Op.like]: `%${search.toLowerCase()}%` }),
                    (0, sequelize_1.where)((0, sequelize_1.fn)('lower', (0, sequelize_1.col)('cpf')), { [sequelize_1.Op.like]: `%${search.toLowerCase()}%` })
                ]
            }
            : {
                role: 'client',
                email: {
                    [sequelize_1.Op.notLike]: `%${accountCancellation_1.CANCELLED_EMAIL_DOMAIN}`,
                },
            };
        const { count, rows } = await UserModel_1.default.findAndCountAll({
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
    }
    catch (error) {
        console.error("Erro ao listar clientes:", error);
        return res.status(500).json({ message: "Erro ao listar clientes no banco." });
    }
};
exports.listUsersAdmin = listUsersAdmin;
/**
 * ESTATÍSTICAS DO DASHBOARD (Admin)
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalClients = await UserModel_1.default.count({
            where: (0, accountCancellation_1.getActiveClientWhereClause)()
        });
        return res.status(200).json({
            totalClients
        });
    }
    catch (error) {
        console.error("Erro ao carregar estatísticas do dashboard:", error);
        return res.status(500).json({ message: "Erro interno ao processar estatísticas." });
    }
};
exports.getDashboardStats = getDashboardStats;
