import express from 'express';
import {
  getOptionsByType,
  getAllOptions,
  createOption,
  updateOption,
  deleteOption,
  initializeDefaultOptions
} from '../controllers/guestOptionController.js';

const router = express.Router();

// Get all options grouped by type
router.get('/', getAllOptions);

// Get options by specific type
router.get('/:type', getOptionsByType);

// Create new option
router.post('/', createOption);

// Update option
router.put('/:id', updateOption);

// Delete option (soft delete)
router.delete('/:id', deleteOption);

// Initialize default options
router.post('/initialize', initializeDefaultOptions);

export default router;









