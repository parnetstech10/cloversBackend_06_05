import sportBookingM from "../models/SportBooking.js";
import { createBookingSchema } from "../config/validatition..js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    // Validate request body
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const booking = new sportBookingM(req.body);
    const savedBooking = await booking.save();
    res.status(201).json({ message: "Booking created successfully!", booking: savedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await sportBookingM.find().populate("memberId").populate("facilityId").sort({createdAt:-1});
    res.status(200).json({success:bookings});
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: error.message });
  }
};

// Get a single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await sportBookingM.findById(req.params.id).populate("memberId").populate("facilityId");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a booking by ID
export const updateBooking = async (req, res) => {
  try {
    // Allow lightweight status update via PUT (even if extra fields are present)
    if (req.body && typeof req.body.status === 'string') {
      const updatedOnlyStatus = await sportBookingM.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!updatedOnlyStatus) {
        return res.status(404).json({ error: "Booking not found." });
      }
      return res.status(200).json({ message: "Booking updated successfully!", booking: updatedOnlyStatus });
    }

    // Otherwise, validate full payload for full updates
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updatedBooking = await sportBookingM.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.status(200).json({ message: "Booking updated successfully!", booking: updatedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update only status (partial update for status field)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    const updated = await sportBookingM.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.status(200).json({ message: 'Status updated', booking: updated });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete a booking by ID
export const deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await sportBookingM.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.status(200).json({ message: "Booking deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
