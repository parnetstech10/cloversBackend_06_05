import FacilityBooking from "../models/facilityBookingModel.js";
import { createBookingSchema } from "../config/validatition..js";

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    // Validate request body
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const booking = new FacilityBooking(req.body);
    const savedBooking = await booking.save();
    res.status(201).json({ message: "Booking created successfully!", booking: savedBooking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await FacilityBooking.find().populate("memberId").populate("facilityId").sort({createdAt:-1});
    res.status(200).json({success:bookings});
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: error.message });
  }
};

// Get a single booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await FacilityBooking.findById(req.params.id).populate("memberId").populate("facilityId");
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
    console.log("Update facility booking request body:", req.body);
    console.log("Update facility booking ID:", req.params.id);
    
    // Check if this is a status-only update (only status field provided)
    const bodyKeys = Object.keys(req.body);
    const isStatusOnlyUpdate = bodyKeys.length === 1 && bodyKeys.includes('status') && typeof req.body.status === 'string';
    
    console.log("Body keys:", bodyKeys);
    console.log("Is status only update:", isStatusOnlyUpdate);
    
    if (isStatusOnlyUpdate) {
      // Handle status-only update
      const updatedOnlyStatus = await FacilityBooking.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!updatedOnlyStatus) {
        return res.status(404).json({ error: "Booking not found." });
      }
      const populated = await FacilityBooking.findById(updatedOnlyStatus._id).populate("memberId").populate("facilityId");
      return res.status(200).json({ message: "Booking updated successfully!", booking: populated });
    }

    // Handle full update - validate full payload
    console.log("Processing full update...");
    const { error } = createBookingSchema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    console.log("Updating facility booking with payload:", req.body);
    const updatedBooking = await FacilityBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    const populated = await FacilityBooking.findById(updatedBooking._id).populate("memberId").populate("facilityId");
    res.status(200).json({ message: "Booking updated successfully!", booking: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a booking by ID
export const deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await FacilityBooking.findByIdAndDelete(req.params.id);
    if (!deletedBooking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    res.status(200).json({ message: "Booking deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
