import express from 'express';
import { createInvoice, listInvoices, getInvoice, addPayment } from '../controllers/supplierInvoiceController.js';

const router = express.Router();

router.get('/', listInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.post('/:id/payments', addPayment);

export default router;









