import express from 'express';
import { listProducts, createProduct, getProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

router.get('/', listProducts);
router.post('/', createProduct);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;










