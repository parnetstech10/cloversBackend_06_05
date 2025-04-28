import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../controllers/facilityBookingController.js";

const router = express.Router();

// Create a new booking
router.post("/", createBooking);
router.get("/", getAllBookings);
router.get("/:id", getBookingById);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
