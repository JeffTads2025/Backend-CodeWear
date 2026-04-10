"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Cart extends sequelize_1.Model {
}
Cart.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    userId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    productId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false }
}, {
    sequelize: database_1.default,
    tableName: 'carts',
    timestamps: true
});
exports.default = Cart;
