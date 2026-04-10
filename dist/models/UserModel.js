"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class User extends sequelize_1.Model {
}
User.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    cpf: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        // Getter: Formata o CPF ao sair do banco para o Front-end
        get() {
            const rawValue = this.getDataValue('cpf');
            return rawValue ? rawValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : rawValue;
        },
        // Setter: Remove pontos e traços antes de salvar no banco
        set(value) {
            this.setDataValue('cpf', value.replace(/\D/g, ''));
        }
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('admin', 'client'),
        allowNull: false,
        defaultValue: 'client'
    },
    phone: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    address: { type: sequelize_1.DataTypes.TEXT, allowNull: false }
}, {
    sequelize: database_1.default,
    tableName: 'users',
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt_1.default.genSalt(10);
                user.password = await bcrypt_1.default.hash(user.password, salt);
            }
        }
    }
});
exports.default = User;
