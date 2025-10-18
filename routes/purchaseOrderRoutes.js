import express from 'express';
import { createPO, listPOs, getPO, updatePO, deletePO, receivePO, approvePO, sendPO, lowStockAlerts } from '../controllers/purchaseOrderController.js';

const router = express.Router();

router.get('/', listPOs);
router.get('/low-stock', lowStockAlerts);
router.post('/', createPO);
router.get('/:id', getPO);
router.put('/:id', updatePO);
router.delete('/:id', deletePO);
router.post('/:id/receive', receivePO);
router.post('/:id/approve', approvePO);
router.post('/:id/send', sendPO);

export default router;










