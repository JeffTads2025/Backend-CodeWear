import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/database';

// Importação dos Modelos (Necessário para o Sequelize criar as tabelas/colunas)
import './models/UserModel';
import './models/ProductModel';
import './models/AuditLogModel';
import './models/OrderModel';
import './models/OrderItemModel';
import './models/CartModel';

// --- CORREÇÃO AQUI ---
// Importamos o arquivo de rotas principal que contém /login, /users, /cart, etc.
// Verifique se o arquivo em 'src/routes/index.ts' (ou o nome do arquivo que você me mandou)
import router from './routes/Routes';

// Configurações Iniciais
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---

// Permite que o Frontend (React/Vite) se conecte ao Backend
app.use(cors());

// Permite que o servidor entenda JSON
app.use(express.json());

// --- CORREÇÃO NAS ROTAS ---
// Agora o servidor conhece TODAS as rotas do projeto de uma vez só
app.use(router);

// --- Inicialização do Banco de Dados e Servidor ---

/**
 * IMPORTANTE: 
 * O professor já corrigiu o erro de dupla criptografia no Model.
 * Agora o .sync() vai garantir que as tabelas existam no banco.
 */
sequelize.sync()
    .then(() => {
        console.log('✅ Banco CodeWear conectado e pronto!');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
            console.log(`🔗 Rota de Login pronta em: http://localhost:${PORT}/login`);
        });
    })
    .catch((err) => {
        console.error('❌ Erro crítico ao conectar ou sincronizar o banco:', err);
    });

export default app;