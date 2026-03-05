import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    public password!: string;
    public cpf!: string;
    public role!: 'admin' | 'client';
    public phone!: string; // Adicionado
    public address!: string; // Adicionado
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
    phone: { 
        type: DataTypes.STRING, 
        allowNull: true 
    },
    address: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    }
}, { // <-- Esta chave fecha o primeiro objeto (campos)
    sequelize,
    tableName: 'users',
}); // <-- Esta fecha o User.init corretamente

export default User;