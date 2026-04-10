import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/database';

// Importação dos Modelos (Necessário para o Sequelize criar/sincronizar as tabelas)
import './models/UserModel';
import './models/ProductModel';
import './models/AuditLogModel';
import './models/OrderModel';
import './models/OrderItemModel';
import './models/CartModel';
import './models/associations';
import router from './routes/Routes';

// Configurações Iniciais
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Rotas ---
app.use(router);

// --- Inicialização do Banco de Dados e Servidor ---

/**
 * MANTENDO O CONTROLE AUTOMÁTICO:
 * O .sync() continua aqui para garantir que sua estrutura de tabelas 
 * esteja sempre atualizada conforme os seus arquivos de Model.
 */
sequelize.sync()
    .then(() => {
        console.log('✅ Banco CodeWear sincronizado automaticamente!');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
            console.log(`🔗 Rota de Login pronta em: http://localhost:${PORT}/login`);
        });
    })
    .catch((err) => {
        console.error('❌ Erro crítico ao sincronizar o banco de dados:', err);
    });

export default app;