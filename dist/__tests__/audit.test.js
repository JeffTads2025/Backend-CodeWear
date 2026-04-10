"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AuditLogModel_1 = __importDefault(require("../models/AuditLogModel"));
const database_1 = __importDefault(require("../config/database"));
describe('Testes de Auditoria (Logs)', () => {
    afterAll(async () => {
        // Fecha a conexão para o Jest encerrar corretamente
        await database_1.default.close();
    });
    test('Deve ser capaz de registrar uma ação de administrador no log', async () => {
        const logData = {
            adminId: 1,
            adminName: 'Admin Jeff',
            action: 'DELETE_PRODUCT',
            details: 'O produto Camiseta Unissex ID 10 foi removido do estoque.'
        };
        const log = await AuditLogModel_1.default.create(logData);
        expect(log.id).toBeDefined();
        expect(log.action).toBe('DELETE_PRODUCT');
        expect(log.adminName).toBe('Admin Jeff');
    });
    test('Deve exigir que os campos obrigatórios sejam informados', async () => {
        await expect(AuditLogModel_1.default.create({
            adminName: 'Admin'
        })).rejects.toMatchObject({ name: 'SequelizeValidationError' });
    });
});
