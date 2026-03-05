import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './UserModel';

class Order extends Model {
    public id!: number;
    public totalValue!: number;
    public status!: string; // Ex: 'pendente', 'pago', 'enviado'
    public paymentMethod!: string; // Ex: 'cartao', 'pix', 'boleto'
    public address!: string; // Onde entregar
}

Order.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    totalValue: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pendente' },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false }
}, {
    sequelize,
    tableName: 'orders',
});

// Associação: Um pedido pertence a um usuário
Order.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });

export default Order;