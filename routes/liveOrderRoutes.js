import express from 'express';
import {
  getLiveOrders,
  createLiveOrder,
  updateLiveOrderStatus,
  moveOrderToHistory,deleteLiveOrder,
  getAllOrderByUserId,
  getAllLiveorderbycat,
  Liveorderbycat,
} from '../controllers/liveOrderController.js';

const router = express.Router();

// Get all live orders
router.get('/', getLiveOrders);

// Create a new live order
router.post('/', createLiveOrder);

// Update live order status
router.patch('/:id', updateLiveOrderStatus);

router.get("/byuser/:id",getAllOrderByUserId);

router.get("/getbycat/:cat",getAllLiveorderbycat);
router.get("/getlivebycat/:cat",Liveorderbycat);
// Move live order to history
router.post('/:id/move-to-history', moveOrderToHistory);

router.delete('/:id', deleteLiveOrder);


export default router;
