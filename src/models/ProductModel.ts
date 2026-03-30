import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 1. Definição dos atributos do Produto
interface ProductAttributes {
  id: number;
  name: string;
  price: number;
  description?: string; // O "?" torna o campo opcional para o TypeScript
  category: string;
  sizes: string;
  stock: number;
  image_url: string;
}

// 2. Definimos quais atributos são opcionais na hora de dar um Product.create()
// Adicionamos 'description' aqui para o VS Code parar de dar erro no Controller
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'description'> { }

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public name!: string;
  public price!: number;
  public description!: string;
  public category!: string;
  public sizes!: string;
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
    allowNull: true // Alterado para TRUE para o Banco de Dados aceitar valores vazios
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unissex'
  },
  sizes: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'P,M,G,GG'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0 // Regra de segurança para o estoque não negativar
    }
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'products',
  timestamps: true // Habilita createdAt e updatedAt
});

export default Product;