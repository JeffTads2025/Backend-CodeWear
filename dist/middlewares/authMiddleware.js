"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const accountCancellation_1 = require("../utils/accountCancellation");
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    // LOG PARA DEBUG: Verifique o terminal do seu Node
    if (!authHeader) {
        console.log("ALERTA: Requisição sem header de autorização.");
        return res.status(401).json({ message: "Login necessário" });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao');
        const currentUser = await UserModel_1.default.findByPk(decoded.id, {
            attributes: ['id', 'name', 'role', 'email']
        });
        if (!currentUser || (0, accountCancellation_1.isCancelledEmail)(currentUser.email)) {
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
    }
    catch (error) {
        console.log("ERRO JWT:", error);
        return res.status(401).json({ message: "Sessão expirada ou inválida" });
    }
};
exports.authMiddleware = authMiddleware;
