import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database'; // Conexão com o banco
import './models/ProductModel'; // Importa o Model para o Sequelize criar a tabela
import productRoutes from './routes/ProductRoutes'; // ACRESCENTADO: Importa suas novas rotas

dotenv.config();
const app = express();

// Middlewares
app.use(express.json());

// Rotas
app.use(productRoutes); // ACRESCENTADO: Ativa as rotas de produto

const PORT = process.env.PORT || 3000;

// O sync() verifica seus Models e cria as tabelas no MySQL automaticamente
sequelize.sync({ force: false })
    .then(() => {
        console.log('Banco CodeWear conectado e tabelas sincronizadas!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erro ao conectar ou sincronizar o banco:', err);
    });