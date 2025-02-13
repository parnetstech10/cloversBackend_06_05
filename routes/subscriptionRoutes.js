import express from 'express';
import {
  createMembership,
  getAllMemberships,
  getMembershipById,
  updateMembershipById,
  deleteMembershipById,
  getallsubcrtionbytype,

} from '../controllers/subcriptionController.js';

const router = express.Router();

router.post('/', createMembership);
router.get('/', getAllMemberships);
router.get("/type/:type",getallsubcrtionbytype);
router.get('/:id', getMembershipById);
router.put('/:id', updateMembershipById);
router.delete('/:id', deleteMembershipById);

export default router;
