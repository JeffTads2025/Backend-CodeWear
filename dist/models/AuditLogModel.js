"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class AuditLog extends sequelize_1.Model {
}
AuditLog.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    adminId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    adminName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    action: { type: sequelize_1.DataTypes.STRING, allowNull: false }, // Ex: "ALTEROU PREÇO"
    details: { type: sequelize_1.DataTypes.TEXT, allowNull: true } // Ex: "De 50.00 para 45.00"
}, {
    sequelize: database_1.default,
    tableName: 'audit_logs',
    timestamps: true // Isso cria automaticamente as colunas 'createdAt' e 'updatedAt'
});
exports.default = AuditLog;
