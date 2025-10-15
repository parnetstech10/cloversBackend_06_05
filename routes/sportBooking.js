import express from "express";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
} from "../controllers/sportBooking.js";

const router = express.Router();

// Create a new booking
router.post("/", createBooking);

// Get all bookings
router.get("/", getAllBookings);

// Get a single booking by ID
router.get("/:id", getBookingById);

// Update a booking by ID
router.put("/:id", updateBooking);
// Partial update for status only (no full schema validation)
router.patch("/:id/status", updateBookingStatus);

// Delete a booking by ID
router.delete("/:id", deleteBooking);

export default router;
