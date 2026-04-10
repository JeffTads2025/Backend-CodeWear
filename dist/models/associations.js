"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CartModel_1 = __importDefault(require("./CartModel"));
const OrderItemModel_1 = __importDefault(require("./OrderItemModel"));
const OrderModel_1 = __importDefault(require("./OrderModel"));
const ProductModel_1 = __importDefault(require("./ProductModel"));
const UserModel_1 = __importDefault(require("./UserModel"));
CartModel_1.default.belongsTo(ProductModel_1.default, { foreignKey: 'productId' });
OrderModel_1.default.belongsTo(UserModel_1.default, { foreignKey: 'userId' });
OrderModel_1.default.hasMany(OrderItemModel_1.default, { foreignKey: 'orderId' });
OrderItemModel_1.default.belongsTo(ProductModel_1.default, { foreignKey: 'productId' });
