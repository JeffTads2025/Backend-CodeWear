import { Router } from 'express';
// Controllers de Produtos
import { 
    listProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} from '../controllers/ProductController';
// Controllers de Usuário
import { createUser, loginUser } from '../controllers/UserController';
// Controllers de Carrinho
import { 
    addToCart, 
    listCart, 
    removeItem, 
    clearCart 
} from '../controllers/CartController';
// Controllers de Pedidos (ADICIONADO)
import { checkout, listMyOrders } from '../controllers/OrderController';
// Middleware de Segurança
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// --- 🛍️ VITRINE (Público) ---
router.get('/products', listProducts);

// --- 🔐 ÁREA DO CLIENTE (Precisa de Login) ---
// Carrinho
router.post('/cart', authMiddleware, addToCart);
router.get('/cart', authMiddleware, listCart);
router.delete('/cart/:id', authMiddleware, removeItem);
router.delete('/cart', authMiddleware, clearCart);

// Pedidos (NOVAS ROTAS ADICIONADAS AQUI)
router.post('/checkout', authMiddleware, checkout);      // Fecha a compra e gera o pedido
router.get('/orders', authMiddleware, listMyOrders);    // Mostra o histórico de compras do cliente

// --- 🛠️ GERENCIAMENTO (Apenas Admin) ---
router.post('/products', authMiddleware, createProduct);
router.put('/products/:id', authMiddleware, updateProduct);
router.delete('/products/:id', authMiddleware, deleteProduct);

// --- 👤 CONTA E ACESSO ---
router.post('/users', createUser); 
router.post('/login', loginUser);   

export default router;