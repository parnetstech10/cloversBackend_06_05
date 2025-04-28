import express from 'express';
const router = express.Router();
import {
    getAllCategories,
    
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/facilityCategoryController.js';

// Get all categories
router.get('/', getAllCategories);

// Get categories by parent type

// Create new category
router.post('/', createCategory);

// Update category
router.put('/:id', updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

export default router;