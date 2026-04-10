"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Importação dos Controllers
const ProductController_1 = require("../controllers/ProductController");
const UserController_1 = require("../controllers/UserController");
const CartController_1 = require("../controllers/CartController");
const OrderController_1 = require("../controllers/OrderController");
const AuditController_1 = require("../controllers/AuditController"); // <-- Importante: Controller de Auditoria
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// --- ROTAS PÚBLICAS ---
router.get('/products', ProductController_1.listProducts); // Já suporta ?page= e ?limit=
router.post('/users', UserController_1.createUser);
router.post('/login', UserController_1.loginUser);
// --- ROTAS DO CLIENTE ---
router.get('/me', authMiddleware_1.authMiddleware, UserController_1.getMe);
router.put('/users/profile', authMiddleware_1.authMiddleware, UserController_1.updateUser);
router.delete('/users/me', authMiddleware_1.authMiddleware, UserController_1.cancelMyAccount);
router.post('/cart', authMiddleware_1.authMiddleware, CartController_1.addToCart);
router.get('/cart', authMiddleware_1.authMiddleware, CartController_1.listCart);
router.put('/cart/:id', authMiddleware_1.authMiddleware, CartController_1.updateCartItem);
router.delete('/cart/:id', authMiddleware_1.authMiddleware, CartController_1.removeItem);
router.post('/checkout', authMiddleware_1.authMiddleware, OrderController_1.checkout);
router.get('/orders', authMiddleware_1.authMiddleware, OrderController_1.listMyOrders);
router.put('/orders/:id', authMiddleware_1.authMiddleware, OrderController_1.updateOrder);
router.delete('/orders/:id', authMiddleware_1.authMiddleware, OrderController_1.deleteOrder);
// --- ROTAS DO ADMIN ---
// Dashboard (Stats)
router.get('/admin/dashboard', authMiddleware_1.authMiddleware, OrderController_1.getAdminDashboard);
// Produtos (Estoque)
router.post('/products', authMiddleware_1.authMiddleware, ProductController_1.createProduct);
router.put('/products/:id', authMiddleware_1.authMiddleware, ProductController_1.updateProduct);
router.delete('/products/:id', authMiddleware_1.authMiddleware, ProductController_1.deleteProduct);
// Vendas/Pedidos
router.get('/admin/all-orders', authMiddleware_1.authMiddleware, OrderController_1.listAllOrdersAdmin);
// Lista de Clientes (Corrigido para suportar paginação se você quiser no futuro)
// Se você criou a função listUsersAdmin no UserController, use-a aqui. 
// Caso contrário, mantivemos a lógica, mas agora modularizada.
router.get('/admin/users', authMiddleware_1.authMiddleware, UserController_1.listUsersAdmin);
// Auditoria (Corrigido: Agora usa o Controller que respeita a paginação da Sidebar)
router.get('/admin/logs', authMiddleware_1.authMiddleware, AuditController_1.listLogs);
exports.default = router;
