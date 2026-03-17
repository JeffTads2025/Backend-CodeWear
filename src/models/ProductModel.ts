import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Product extends Model {
  public id!: number;
  public name!: string;
  public price!: number;
  public description!: string;
  public category!: string;
  public stock!: number;
  public image_url!: string; // Campo novo para a foto
}

Product.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  image_url: { type: DataTypes.STRING, allowNull: true } // Link da imagem
}, {
  sequelize,
  tableName: 'products',
  timestamps: true
});

export default Product;