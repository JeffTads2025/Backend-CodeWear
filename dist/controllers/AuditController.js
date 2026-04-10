"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLogs = void 0;
const sequelize_1 = require("sequelize"); // <--- Verifique se esta linha existe!
const AuditLogModel_1 = __importDefault(require("../models/AuditLogModel"));
const listLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;
        // Filtro de busca
        const whereClause = search ? {
            [sequelize_1.Op.or]: [
                { action: { [sequelize_1.Op.like]: `%${search}%` } }, // Use Op.like para MySQL/SQLite
                { adminName: { [sequelize_1.Op.like]: `%${search}%` } }, // Use Op.iLike apenas para Postgres
                { details: { [sequelize_1.Op.like]: `%${search}%` } }
            ]
        } : {};
        const { count, rows } = await AuditLogModel_1.default.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            logs: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    }
    catch (error) {
        // Isso ajudará você a ver o erro real no terminal do VS Code/Node
        console.error("DETALHE DO ERRO 500:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};
exports.listLogs = listLogs;
