import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Order from './OrderModel';
import Product from './ProductModel';

class OrderItem extends Model {
    public id!: number;
    public quantity!: number;
    public priceAtPurchase!: number;
    public orderId!: number;
    public productId!: number;
}

OrderItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    priceAtPurchase: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // Preço no momento da compra
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    sequelize,
    tableName: 'order_items',
    timestamps: true
});

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });

export default OrderItem;