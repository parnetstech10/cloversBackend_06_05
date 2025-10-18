import sportBookingM from "../models/SportBooking.js";
import { createBookingSchema } from "../config/validatition..js";

// Helper to coerce various time inputs to HH:mm string
const toHHmm = (value) => {
  if (!value) return value;
  if (typeof value === 'string') return value;
  try {
    const d = new Date(value);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch (_) {
    return value;
  }
};

// Create a new booking
export const createBooking = async (req, res) => {
  try {
    // Normalize incoming date/time
    const payload = { ...req.body };
    if (payload.bookingDate && typeof payload.bookingDate === 'string') {
      // Expect YYYY-MM-DD; store as Date at start of day (local)
      payload.bookingDate = new Date(`${payload.bookingDate}T00:00:00`);
    }
    if (payload.startTime) payload.startTime = toHHmm(payload.startTime);
    if (payload.endTime) payload.endTime = toHHmm(payload.endTime);

    // Validate request body
    const { error } = createBookingSchema.validate(payload);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const booking = new sportBookingM(payload);
    const savedBooking = await booking.save();
    const populated = await sportBookingM
      .findById(savedBooking._id)
      .populate("memberId")
      .populate("facilityId");
    res.status(201).json({ message: "Booking created successfully!", booking: populated });
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
    console.log("Update booking request body:", req.body);
    console.log("Update booking ID:", req.params.id);
    
    // Check if this is a status-only update (only status field provided)
    const bodyKeys = Object.keys(req.body);
    const isStatusOnlyUpdate = bodyKeys.length === 1 && bodyKeys.includes('status') && typeof req.body.status === 'string';
    
    console.log("Body keys:", bodyKeys);
    console.log("Is status only update:", isStatusOnlyUpdate);
    
    if (isStatusOnlyUpdate) {
      // Handle status-only update
      const updatedOnlyStatus = await sportBookingM.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!updatedOnlyStatus) {
        return res.status(404).json({ error: "Booking not found." });
      }
      const populated = await sportBookingM.findById(updatedOnlyStatus._id).populate("memberId").populate("facilityId");
      return res.status(200).json({ message: "Booking updated successfully!", booking: populated });
    }

    // Handle full update - normalize & validate full payload
    console.log("Processing full update...");
    const payload = { ...req.body };
    if (payload.bookingDate && typeof payload.bookingDate === 'string') {
      payload.bookingDate = new Date(`${payload.bookingDate}T00:00:00`);
    }
    if (payload.startTime) payload.startTime = toHHmm(payload.startTime);
    if (payload.endTime) payload.endTime = toHHmm(payload.endTime);

    console.log("Normalized payload:", payload);

    const { error } = createBookingSchema.validate(payload);
    if (error) {
      console.log("Validation error:", error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    console.log("Updating booking with payload:", payload);
    const updatedBooking = await sportBookingM.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    const populated = await sportBookingM
      .findById(updatedBooking._id)
      .populate("memberId")
      .populate("facilityId");
    res.status(200).json({ message: "Booking updated successfully!", booking: populated });
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
