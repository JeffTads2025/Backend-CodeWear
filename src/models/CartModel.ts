import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './UserModel';
import Product from './ProductModel';

class Cart extends Model {
    public id!: number;
    public quantity!: number;
    public userId!: number;
    public productId!: number;
}

Cart.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    sequelize,
    tableName: 'carts',
    timestamps: true
});

// Relacionamentos Diretos
Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.belongsTo(Product, { foreignKey: 'productId' });

// Relacionamentos Inversos (Isso resolve a busca do Controller sem erro circular)
User.hasMany(Cart, { foreignKey: 'userId' });
Product.hasMany(Cart, { foreignKey: 'productId' });

export default Cart;