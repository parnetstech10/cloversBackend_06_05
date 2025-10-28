// routes/membershipRoutes.js
import { Router } from 'express';
import {
  createMembership,
  getMemberships,
  getMembershipById,
  updateMembership,
  deleteMembership,
  renewMembership,
  getAllRenewals,
  createRenewal,
  getActiveMemberships,
  changeMemberStatus,
  getAllActivecard
} from '../controllers/membershipController.js';
import { scanMembershipByCode } from '../controllers/membershipController.js';

const router = Router();

// CREATE a new membership
router.post('/', createMembership);

// GET membership plans
router.get('/', getMemberships);

// IMPORTANT: Put /renewals BEFORE the /:id route
router.get('/renewals', getAllRenewals);
router.post('/renewals', createRenewal);
router.put('/renewals/:id', changeMemberStatus);
router.get("/activemembership/:id",getActiveMemberships);
router.get("/allactivecard/:id",getAllActivecard);
// QR/Code scan endpoint
router.get('/scan/:code', scanMembershipByCode);

// GET membership by ID
router.get('/:id', getMembershipById);

// UPDATE membership
router.put('/:id', updateMembership);

// DELETE membership
router.delete('/:id', deleteMembership);

// POST renewal
router.post('/renew', renewMembership);

export default router;
