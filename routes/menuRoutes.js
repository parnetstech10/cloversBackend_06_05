import express from 'express';
import {
    getMenu,
    addMenuCategory,
    addSubCategory,
    addItem,
    deleteSubCategory,
    deleteItem,
    getCategory,
    editCategory,
    editSubCategory,
    deleteCategory,
} from '../controllers/menuController.js';

const router = express.Router();

router.get('/', getMenu); // Fetch the menu
router.post('/category', addMenuCategory); // Add a new category
router.post('/:categoryId/subcategory', addSubCategory); // Add a new subcategory
router.post('/:categoryId/subcategory/:subCategoryId/item', addItem); // Add a new item with or without measures
router.delete('/:categoryId/subcategory/:subCategoryId', deleteSubCategory); // Delete a subcategory
router.delete('/:categoryId/subcategory/:subCategoryId/item/:itemId', deleteItem); // Delete an item
router.get('/getCategory' , getCategory)
router.post('/editCategory' , editCategory)
router.delete('/deleteCategory/:id' , deleteCategory)
router.put('/editSubCategory' , editSubCategory)
router.delete('/deleteSubCategory/:categoryId/:subCategoryId' , deleteSubCategory)




export default router;
