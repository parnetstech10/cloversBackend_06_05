import express from "express";
import { 
  createBookfacility,
  getAllBookfacility,
  getUserBookfacility, 
  getBookfacilityById, 
  updateBookfacilityStatus, 
  deleteBookfacility
} from "../controllers/BookFacility.js";

const router = express.Router();

// Base path: /api/facility/booking
router.post('/createBookfacility', createBookfacility);
router.get('/getAllBookfacility', getAllBookfacility);
router.get('/getUserBookfacility/:userId', getUserBookfacility);
router.get('/getBookfacilityById/:id', getBookfacilityById);
router.patch('/updateBookfacilityStatus/:id', updateBookfacilityStatus);
router.delete('/deleteBookfacility/:id', deleteBookfacility);

export default router;