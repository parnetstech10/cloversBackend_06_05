import express from 'express';
import {
  getLiveOrders,
  createLiveOrder,
  updateLiveOrderStatus,
  moveOrderToHistory,deleteLiveOrder,
} from '../controllers/liveOrderController.js';

const router = express.Router();

// Get all live orders
router.get('/', getLiveOrders);

// Create a new live order
router.post('/', createLiveOrder);

// Update live order status
router.patch('/:id', updateLiveOrderStatus);

// Move live order to history
router.post('/:id/move-to-history', moveOrderToHistory);

router.delete('/:id', deleteLiveOrder);


export default router;
