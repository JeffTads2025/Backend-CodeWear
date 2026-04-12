import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Order extends Model {
    public id!: number;
    public totalValue!: number;
    public status!: string; 
    public paymentMethod!: string; 
    public address!: string; 
    public userId!: number;
}

Order.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    totalValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pendente' },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    sequelize,
    tableName: 'orders',
    timestamps: true
});

export default Order;