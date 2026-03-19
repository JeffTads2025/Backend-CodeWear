import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 1. Definimos os atributos do Produto para o TypeScript (Interface)
interface ProductAttributes {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  sizes: string; // Guardaremos como "P,M,G,GG" para ser compatível com SQL
  stock: number;
  image_url: string;
}

// 2. Definimos quais atributos são opcionais na criação (ex: o ID que o banco gera)
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public price!: number;
  public description!: string;
  public category!: string;
  public sizes!: string; // Campo para a grade unissex
  public stock!: number;
  public image_url!: string;

  // Timestamps automáticos do Sequelize
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init({
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  price: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: true 
  },
  category: { 
    type: DataTypes.STRING, 
    allowNull: true,
    defaultValue: 'Unissex' // Já que seu foco é esse!
  },
  sizes: { 
    type: DataTypes.STRING, 
    allowNull: false,
    defaultValue: 'P,M,G,GG' // Grade padrão de camisetas
  },
  stock: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  image_url: { 
    type: DataTypes.STRING, 
    allowNull: true 
  }
}, {
  sequelize,
  tableName: 'products',
  timestamps: true
});

export default Product;