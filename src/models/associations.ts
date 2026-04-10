import Cart from './CartModel';
import OrderItem from './OrderItemModel';
import Order from './OrderModel';
import Product from './ProductModel';
import User from './UserModel';

Cart.belongsTo(Product, { foreignKey: 'productId' });
Order.belongsTo(User, { foreignKey: 'userId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });