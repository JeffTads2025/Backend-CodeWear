import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

// Definição dos atributos do usuário
interface UserAttributes {
    id: number;
    name: string;
    email: string;
    password?: string;
    cpf: string;
    role: 'admin' | 'client';
    phone?: string;
    address?: string;
}

// Atributos necessários para criar um novo usuário (id é opcional pois é auto-increment)
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public name!: string;
    public email!: string;
    public password!: string;
    public cpf!: string;
    public role!: 'admin' | 'client';
    public phone!: string;
    public address!: string;

    // Timestamps (opcional, se o Sequelize os gerir automaticamente)
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
    cpf: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: { 
        type: DataTypes.ENUM('admin', 'client'), 
        allowNull: false, 
        defaultValue: 'client' 
    },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true }
}, {
    sequelize,
    tableName: 'users',
});

// Hook tipado corretamente
User.addHook('beforeSave', async (user: User): Promise<void> => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

export default User;