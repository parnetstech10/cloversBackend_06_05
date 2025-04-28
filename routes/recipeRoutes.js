import express from 'express';
import { 
  addRecipe, 
  getRecipes, 
  getRecipeByMenuItemName, 
  deductFromOrder,
  getLowStockItems,
  addInventoryPurchase,
  getInventoryUsageHistory
} from '../controllers/RecipeController.js';

const router = express.Router();

router.post('/recipes', addRecipe);
router.get('/recipes', getRecipes);
router.get('/recipes/:menuItemName', getRecipeByMenuItemName);

router.post('/deduct-from-order', deductFromOrder);

router.get('/inventory/low-stock', getLowStockItems);
router.post('/inventory/add-purchase', addInventoryPurchase);
router.get('/inventory/usage-history/:itemId', getInventoryUsageHistory);

export default router;
