import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database';
import './models/ProductModel';
import './models/UserModel'; // Importante para criar a tabela de usuários
import productRoutes from './routes/ProductRoutes';

dotenv.config();
const app = express();

// Middlewares
// Permite que o Express entenda JSON enviado pelo Insomnia ou pelo React
app.use(express.json());

// Rotas
// Ativa as rotas de produtos e de usuários que configuramos
app.use(productRoutes);

const PORT = process.env.PORT || 3000;

// O sync({ alter: true }) atualiza as tabelas existentes com novas colunas (como o 'role')
// sem apagar os dados atuais.
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Banco CodeWear conectado e tabelas sincronizadas!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Erro ao conectar ou sincronizar o banco:', err);
    });