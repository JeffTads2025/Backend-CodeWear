import { Router } from 'express';
import { listProducts } from '../controllers/ProductController'; // Importa a lógica que você já fez

const router = Router();

// Define que quando acessar /products (GET), chama o controller
router.get('/products', listProducts);

export default router;