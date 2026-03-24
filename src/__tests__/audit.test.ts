import AuditLog from '../models/AuditLogModel';
import sequelize from '../config/database';

describe('Testes de Auditoria (Logs)', () => {

  afterAll(async () => {
    // Fecha a conexão para o Jest encerrar corretamente
    await sequelize.close();
  });

  test('Deve ser capaz de registrar uma ação de administrador no log', async () => {
    const logData = {
      adminId: 1,
      adminName: 'Admin Jeff',
      action: 'DELETE_PRODUCT',
      details: 'O produto Camiseta Unissex ID 10 foi removido do estoque.'
    };

    const log = await AuditLog.create(logData);

    expect(log.id).toBeDefined();
    expect(log.action).toBe('DELETE_PRODUCT');
    expect(log.adminName).toBe('Admin Jeff');
  });

  test('Deve exigir que os campos obrigatórios sejam informados', async () => {
    try {
      // Tentando criar sem os campos obrigatórios (forçando o erro de validação)
      // Usamos o type casting apenas para simular o erro, sem usar 'any'
      await AuditLog.create({
        adminName: 'Admin'
      } as { adminId: number; adminName: string; action: string; details: string });
    } catch (error: unknown) {
      const err = error as Error;
      expect(err.name).toBe('SequelizeValidationError');
    }
  });
});