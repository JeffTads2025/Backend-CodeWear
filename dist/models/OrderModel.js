"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Order extends sequelize_1.Model {
}
Order.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    totalValue: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: sequelize_1.DataTypes.STRING, defaultValue: 'pendente' },
    paymentMethod: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    address: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false }
}, {
    sequelize: database_1.default,
    tableName: 'orders',
    timestamps: true
});
exports.default = Order;
