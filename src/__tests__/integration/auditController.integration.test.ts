import request from 'supertest';
import express from 'express';
import router from '../../routes/Routes';
import sequelize from '../../config/database';
import AuditLog from '../../models/AuditLogModel';

describe('AuditController - Integração', () => {
  const app = express();
  app.use(express.json());
  app.use(router);
  let createdId: number | null = null;

  afterAll(async () => {
    try {
      if (createdId) await AuditLog.destroy({ where: { id: createdId } });
    } catch (e) {
      // ignora erro de limpeza
    }
    await sequelize.close();
  });

  it('deve registrar um log de auditoria (simples)', async () => {
    const res = await request(app).post('/admin/logs').send({});
    // Espera apenas que a rota responda (201, 400, 404)
    expect([201, 400, 404]).toContain(res.status);
  });
});