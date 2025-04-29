import express from 'express';
import { getAllItems, createItem, updateItem, deleteItem, getAllCategories, createCategory } from '../controllers/generalinventoryController.js';

const router = express.Router();

router.get('/', getAllItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

router.get('/categories', getAllCategories);
router.post('/categories', createCategory);

export default router;