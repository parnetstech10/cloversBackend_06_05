import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  addBarMenuCategory,
  addBrand,
  addItem,
  deleteCategory,
  deleteItem,
  deleteSubCategory,
  editBrand,
  editCategory,
  getBarMenu,
  getCategory,
} from "../controllers/barMenuController.js";

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "../public/menu");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "_" + file.originalname);
//   },
// });

// const upload = multer({ storage: storage });




// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(process.cwd(), "public/bar");


// Ensure directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = uploadPath;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });





const router = express.Router();

router.get("/", getBarMenu); // Fetch the menu
router.post("/category", addBarMenuCategory); // Add a new category
router.post("/:categoryId/brand", addBrand); // Add a new subcategory
router.post("/:categoryId/brand/:brandId/item", upload.any(), addItem); // Add a new item with or without measures
router.delete('/:categoryId/subcategory/:subCategoryId', deleteSubCategory); // Delete a subcategory
router.delete('/:categoryId/subcategory/:subCategoryId/item/:itemId', deleteItem); // Delete an item
router.get("/getCategory", getCategory);
router.post('/editCategory' , editCategory)
router.delete('/deleteCategory/:id' , deleteCategory)
router.put('/editSubCategory' , editBrand)
router.delete('/deleteSubCategory/:categoryId/:subCategoryId' , deleteSubCategory)

export default router;
