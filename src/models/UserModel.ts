import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password?: string;
  cpf: string;
  role: 'admin' | 'client';
  phone: string;
  address: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public cpf!: string;
  public role!: 'admin' | 'client';
  public phone!: string;
  public address!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: { type: DataTypes.STRING, allowNull: false },
  cpf: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    // Getter: Formata o CPF ao sair do banco para o Front-end
    get() {
      const rawValue = this.getDataValue('cpf');
      return rawValue ? rawValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : rawValue;
    },
    // Setter: Remove pontos e traços antes de salvar no banco
    set(value: string) {
      this.setDataValue('cpf', value.replace(/\D/g, ''));
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'client'),
    allowNull: false,
    defaultValue: 'client'
  },
  phone: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false }
}, {
  sequelize,
  tableName: 'users',
  hooks: {
    beforeSave: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

export default User;