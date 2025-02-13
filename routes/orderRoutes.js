import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  deleteOrder,
} from '../controllers/orderController.js';

const router = express.Router();

// Route to create a new order
router.post('/', createOrder);

// Route to get all orders
router.get('/', getAllOrders);

// Route to get an order by ID
router.get('/:id', getOrderById);

// Route to delete an order
router.delete('/:id', deleteOrder);

export default router;
