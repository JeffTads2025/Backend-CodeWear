import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Carrega as variáveis do .env
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME!, // CodeWear
    process.env.DB_USER!, // root
    process.env.DB_PASS,  // vazio
    {
        host: process.env.DB_HOST, // localhost
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: true // Mostra consultas SQL no terminal
    }
);

export default sequelize;