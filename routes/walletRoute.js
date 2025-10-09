// routes/wallet.js
import express from 'express';
import { getWalletBalance, getTransactionHistory, addMoney, deductMoney } from '../controllers/walletController.js';

const router = express.Router();

// Use :userId in the route
router.get('/balance/:userId', getWalletBalance);
router.get('/transactions', getTransactionHistory);
router.get('/transactions/:user', getTransactionHistory);

router.post('/add', addMoney);
router.post('/deduct', deductMoney);

export default router;
