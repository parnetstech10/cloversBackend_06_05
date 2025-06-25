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
import multer from 'multer';

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "/public/menu");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "_" + file.originalname);
//   },
// });

// const upload = 




import path from 'path';
import fs from 'fs';

const __dirname = path.resolve();
const uploadPath = path.join(__dirname, 'public/menu');

// Ensure the directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer();





const router = express.Router();

router.get('/', getMenu); // Fetch the menu
router.post('/category', addMenuCategory); // Add a new category
router.post('/:categoryId/subcategory', addSubCategory); // Add a new subcategory
router.post('/:categoryId/subcategory/:subCategoryId/item', upload.any() ,addItem); // Add a new item with or without measures
router.delete('/:categoryId/subcategory/:subCategoryId', deleteSubCategory); // Delete a subcategory
router.delete('/:categoryId/subcategory/:subCategoryId/item/:itemId', deleteItem); // Delete an item
router.get('/getCategory' , getCategory)
router.post('/editCategory' , editCategory)
router.delete('/deleteCategory/:id' , deleteCategory)
router.put('/editSubCategory' , editSubCategory)
router.delete('/deleteSubCategory/:categoryId/:subCategoryId' , deleteSubCategory)




export default router;
