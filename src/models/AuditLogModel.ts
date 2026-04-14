import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class AuditLog extends Model {
  public id!: number;
  public adminId!: number;
  public adminName!: string;
  public action!: string;
  public details!: string;
}

AuditLog.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  adminId: { type: DataTypes.INTEGER, allowNull: false },
  adminName: { type: DataTypes.STRING, allowNull: false },
  action: { type: DataTypes.STRING, allowNull: false }, 
  details: { type: DataTypes.TEXT, allowNull: true }    
}, {
  sequelize,
  tableName: 'audit_logs',
  timestamps: true 
});

export default AuditLog;