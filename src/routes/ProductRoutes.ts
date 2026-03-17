import { Router } from 'express';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../controllers/ProductController';
import { createUser, loginUser } from '../controllers/UserController';
import { addToCart, listCart, removeItem, clearCart } from '../controllers/CartController';
import { checkout, listMyOrders, getAdminDashboard } from '../controllers/OrderController';
import { authMiddleware } from '../middlewares/authMiddleware';
import AuditLog from '../models/AuditLogModel'; // Importado para a rota de logs

const router = Router();

// --- Rotas Públicas ---
// Qualquer um pode ver produtos, criar conta ou logar
router.get('/products', listProducts);
router.post('/users', createUser);
router.post('/login', loginUser);

// --- Rotas Cliente (Privadas) ---
// Precisa estar logado (authMiddleware)
router.post('/cart', authMiddleware, addToCart);
router.get('/cart', authMiddleware, listCart);
router.delete('/cart/:id', authMiddleware, removeItem);
router.post('/checkout', authMiddleware, checkout);
router.get('/orders', authMiddleware, listMyOrders);

// --- Rotas Admin (Restritas) ---
// O authMiddleware aqui também valida se o 'role' é 'admin'
router.post('/products', authMiddleware, createProduct);
router.put('/products/:id', authMiddleware, updateProduct);
router.delete('/products/:id', authMiddleware, deleteProduct);
router.get('/admin/dashboard', authMiddleware, getAdminDashboard);

// --- NOVA ROTA DE AUDITORIA ---
// Esta rota permite que o Admin veja quem alterou preços ou deletou itens
router.get('/admin/logs', authMiddleware, async (req, res) => {
    try {
        const logs = await AuditLog.findAll({ order: [['createdAt', 'DESC']] });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Erro ao carregar logs de auditoria" });
    }
});

export default router;