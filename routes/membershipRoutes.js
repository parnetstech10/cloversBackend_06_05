// routes/membershipRoutes.js
import { Router } from 'express';
import {
  createMembership,
  getMemberships,
  getMembershipById,
  updateMembership,
  deleteMembership,
  renewMembership,
  getAllRenewals
} from '../controllers/membershipController.js';

const router = Router();

// CREATE a new membership
router.post('/', createMembership);

// GET membership plans
router.get('/', getMemberships);

// IMPORTANT: Put /renewals BEFORE the /:id route
router.get('/renewals', getAllRenewals);

// GET membership by ID
router.get('/:id', getMembershipById);

// UPDATE membership
router.put('/:id', updateMembership);

// DELETE membership
router.delete('/:id', deleteMembership);

// POST renewal
router.post('/renew', renewMembership);

export default router;
