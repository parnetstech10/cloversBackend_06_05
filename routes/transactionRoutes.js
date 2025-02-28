// routes/transactionRoutes.js
import express from 'express';
import { 
  getTransactions, 
  getTransaction,
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '../controllers/transactionCotroller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(addTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;