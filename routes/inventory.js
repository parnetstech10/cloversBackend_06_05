import express from 'express';
import {
  getAllInventory,
  getInventoryByCategory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getInventoryLogs,
  getLowStockItems,
  getDashboardData,
  getMovementStats,
  testCreateInventory
} from '../controllers/inventoryController.js';

const router = express.Router();

// Get all inventory with optional filters
router.get('/', getAllInventory);

// Get low stock items (must come before /:category)
router.get('/low-stock', getLowStockItems);

// Get dashboard data (must come before /:category)
router.get('/dashboard', getDashboardData);

// Get inventory logs for an item (must come before /:category)
router.get('/logs/:id', getInventoryLogs);

// Get movement statistics for an item (must come before /:category)
router.get('/stats/:id', getMovementStats);

// Get single inventory item (must come before /:category)
router.get('/item/:id', getInventoryItem);

// Get inventory by category (must come last among GET routes with parameters)
router.get('/:category', getInventoryByCategory);

// Create new inventory item
router.post('/', createInventoryItem);

// Update inventory item
router.put('/:id', updateInventoryItem);

// Delete inventory item
router.delete('/:id', deleteInventoryItem);

// Adjust stock manually
router.post('/:id/adjust', adjustStock);

// Test endpoint
router.post('/test', testCreateInventory);

export default router;
