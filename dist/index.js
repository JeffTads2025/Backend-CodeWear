"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const database_1 = __importDefault(require("./config/database"));
// Importação dos Modelos (Necessário para o Sequelize criar/sincronizar as tabelas)
require("./models/UserModel");
require("./models/ProductModel");
require("./models/AuditLogModel");
require("./models/OrderModel");
require("./models/OrderItemModel");
require("./models/CartModel");
require("./models/associations");
const Routes_1 = __importDefault(require("./routes/Routes"));
// Configurações Iniciais
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Rotas ---
app.use(Routes_1.default);
// --- Inicialização do Banco de Dados e Servidor ---
/**
 * MANTENDO O CONTROLE AUTOMÁTICO:
 * O .sync() continua aqui para garantir que sua estrutura de tabelas
 * esteja sempre atualizada conforme os seus arquivos de Model.
 */
database_1.default.sync()
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
exports.default = app;
