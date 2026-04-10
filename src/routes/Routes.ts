import { Router } from 'express';
// Importação dos Controllers
import { listProducts, createProduct, updateProduct, deleteProduct } from '../controllers/ProductController';
import { cancelMyAccount, createUser, loginUser, getMe, updateUser, listUsersAdmin } from '../controllers/UserController';
import { addToCart, listCart, updateCartItem, removeItem } from '../controllers/CartController';
import { checkout, listMyOrders, updateOrder, deleteOrder, getAdminDashboard, listAllOrdersAdmin } from '../controllers/OrderController';
import { listLogs } from '../controllers/AuditController'; // <-- Importante: Controller de Auditoria
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- ROTAS PÚBLICAS ---
router.get('/products', listProducts); // Já suporta ?page= e ?limit=
router.post('/users', createUser);
router.post('/login', loginUser);

// --- ROTAS DO CLIENTE ---
router.get('/me', authMiddleware, getMe);
router.put('/users/profile', authMiddleware, updateUser);
router.delete('/users/me', authMiddleware, cancelMyAccount);
router.post('/cart', authMiddleware, addToCart);
router.get('/cart', authMiddleware, listCart);
router.put('/cart/:id', authMiddleware, updateCartItem);
router.delete('/cart/:id', authMiddleware, removeItem);
router.post('/checkout', authMiddleware, checkout);
router.get('/orders', authMiddleware, listMyOrders);
router.put('/orders/:id', authMiddleware, updateOrder);
router.delete('/orders/:id', authMiddleware, deleteOrder);

// --- ROTAS DO ADMIN ---

// Dashboard (Stats)
router.get('/admin/dashboard', authMiddleware, getAdminDashboard);

// Produtos (Estoque)
router.post('/products', authMiddleware, createProduct);
router.put('/products/:id', authMiddleware, updateProduct);
router.delete('/products/:id', authMiddleware, deleteProduct);

// Vendas/Pedidos
router.get('/admin/all-orders', authMiddleware, listAllOrdersAdmin);

// Lista de Clientes (Corrigido para suportar paginação se você quiser no futuro)
// Se você criou a função listUsersAdmin no UserController, use-a aqui. 
// Caso contrário, mantivemos a lógica, mas agora modularizada.
router.get('/admin/users', authMiddleware, listUsersAdmin);

// Auditoria (Corrigido: Agora usa o Controller que respeita a paginação da Sidebar)
router.get('/admin/logs', authMiddleware, listLogs);

export default router;
