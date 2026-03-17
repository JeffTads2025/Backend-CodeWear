import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/database';

// Importação dos Modelos (Necessário para o Sequelize criar as tabelas/colunas)
import './models/UserModel';
import './models/ProductModel';
import './models/AuditLogModel'; // Novo modelo de auditoria para os logs dos admins
import './models/OrderModel';
import './models/OrderItemModel';
import './models/CartModel';

// Importação das Rotas
import productRoutes from './routes/ProductRoutes';

// Configurações Iniciais
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---

// Permite que o Frontend (React/Vite) se conecte ao Backend sem bloqueios de segurança
app.use(cors()); 

// Permite que o servidor entenda o formato JSON enviado nas requisições
app.use(express.json());

// --- Rotas ---
app.use(productRoutes);

// --- Inicialização do Banco de Dados e Servidor ---

// O 'alter: true' garante que novas colunas (como role, stock, image_url) 
// sejam criadas automaticamente sem apagar seus dados existentes.
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Banco CodeWear conectado e sincronizado com sucesso!');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Erro crítico ao conectar ou sincronizar o banco:', err);
    });