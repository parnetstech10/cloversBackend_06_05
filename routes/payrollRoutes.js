// routes/payrollRoutes.js
import express from 'express';
import { getAllPayrolls, createPayroll, processNextMonth, updatePaymentStatus, getPayrollByEmployee } from '../controllers/payrollController.js';

const router = express.Router();

router.get('/', getAllPayrolls);
router.get('/employee/:employeeId', getPayrollByEmployee);
router.post('/', createPayroll);
router.post('/next-month', processNextMonth);
router.patch('/:id/status', updatePaymentStatus);

export default router;