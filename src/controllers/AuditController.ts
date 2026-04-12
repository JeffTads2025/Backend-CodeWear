import { Request, Response } from 'express';
import { Op } from 'sequelize'; 
import AuditLog from '../models/AuditLogModel';

export const listLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    // Filtro de busca
    const whereClause = search ? {
      [Op.or]: [
        { action: { [Op.like]: `%${search}%` } },     
        { adminName: { [Op.like]: `%${search}%` } },   
        { details: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      logs: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    
    console.error("DETALHE DO ERRO 500:", error);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};
