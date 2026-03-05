import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Order from './OrderModel';
import Product from './ProductModel';

class OrderItem extends Model {}

OrderItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    priceAtPurchase: { type: DataTypes.DECIMAL(10, 2), allowNull: false } // Preço no momento da compra
}, {
    sequelize,
    tableName: 'order_items',
});

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });

export default OrderItem;