import express from 'express';

import { 
  getWalletBalance, 
  getTransactionHistory, 
  addMoney, 
  deductMoney 
} from '../controllers/walletController.js';

const router = express.Router();

// User routes
router.get('/balance', getWalletBalance);
router.get('/transactions', getTransactionHistory);
router.get('/transactions/:user', getTransactionHistory);

// Admin routes
router.post('/add', addMoney);
router.post('/deduct', deductMoney);

export default router;
