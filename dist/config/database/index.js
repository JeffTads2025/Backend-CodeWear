"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
// Carrega as variáveis do .env
dotenv_1.default.config();
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, // CodeWear
process.env.DB_USER, // root
process.env.DB_PASS, // vazio
{
    host: process.env.DB_HOST, // localhost
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: true // Mostra consultas SQL no terminal
});
exports.default = sequelize;
