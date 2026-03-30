import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Product from './ProductModel';

class Cart extends Model {
    public id!: number;
    public quantity!: number;
    public size!: string; 
    public userId!: number;
    public productId!: number;
}

Cart.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    size: { type: DataTypes.STRING, allowNull: false, defaultValue: 'M' },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false }
}, {
    sequelize,
    tableName: 'carts',
    timestamps: true
});

// Relacionamento necessário para listar os dados do produto no carrinho
Cart.belongsTo(Product, { foreignKey: 'productId' });

export default Cart;