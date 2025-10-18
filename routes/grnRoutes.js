import express from 'express';
import { createGRN, listGRNs, getGRN } from '../controllers/grnController.js';

const router = express.Router();

router.get('/', listGRNs);
router.post('/', createGRN);
router.get('/:id', getGRN);

export default router;













