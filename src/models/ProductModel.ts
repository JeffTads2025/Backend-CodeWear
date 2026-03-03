import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database'; // Importa a conexão correta

class Product extends Model {
    public id!: number;
    public name!: string;
    public price!: number;
}

Product.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'products', // Nome da tabela no banco CodeWear
        timestamps: false,     // Define se a tabela terá created_at e updated_at
    }
);

export default Product;