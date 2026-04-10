"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserModel_1 = __importDefault(require("../models/UserModel"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../config/database"));
describe('Testes de Autenticação e Usuário', () => {
    afterAll(async () => {
        await database_1.default.close();
    });
    test('Deve criptografar a senha antes de salvar no banco', async () => {
        // Usamos um timestamp para o e-mail nunca ser igual ao de rodadas anteriores
        const uniqueEmail = `teste${Date.now()}@codewear.com`;
        const password = 'senha_segura_123';
        const user = await UserModel_1.default.create({
            name: 'User Teste',
            email: uniqueEmail,
            password: password,
            cpf: `cpf-${Date.now()}`, // CPF único também
            role: 'client',
            phone: '11999999999',
            address: 'Rua Teste, 123'
        });
        expect(user.password).not.toBe(password);
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        expect(isMatch).toBe(true);
    });
    test('Não deve permitir o cadastro de dois usuários com o mesmo E-mail', async () => {
        const duplicateEmail = `duplicado${Date.now()}@codewear.com`;
        // Criamos o primeiro
        await UserModel_1.default.create({
            name: 'Primeiro',
            email: duplicateEmail,
            password: '123',
            cpf: `cpf1-${Date.now()}`,
            role: 'client',
            phone: '11999999999',
            address: 'Rua Teste, 123'
        });
        await expect(UserModel_1.default.create({
            name: 'Segundo',
            email: duplicateEmail,
            password: '123',
            cpf: `cpf2-${Date.now()}`,
            role: 'client',
            phone: '11888888888',
            address: 'Rua Teste, 456'
        })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    });
});
