import AuditLog from '../../models/AuditLogModel';
import sequelize from '../../config/database';

describe('Testes de Auditoria (Logs)', () => {
  afterEach(async () => {
    await AuditLog.destroy({
      where: {
        adminName: 'Admin Jeff',
        details: 'O produto Camiseta Unissex ID 10 foi removido do estoque.'
      }
    });
  });
  afterAll(async () => {
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
    await expect(
      AuditLog.create({
        adminName: 'Admin'
      } as any)
    ).rejects.toMatchObject({ name: 'SequelizeValidationError' });
  });
});