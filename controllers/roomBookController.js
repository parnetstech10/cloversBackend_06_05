import RoomBooking from "../models/roomBooking.js";
import { body, validationResult } from "express-validator";

// Create a new booking with validation
export const createBooking = async (req, res) => {
    await Promise.all([
        body("memberId").notEmpty().withMessage("Member ID is required").run(req),
        body("roomId").notEmpty().withMessage("Room ID is required").run(req),
        body("roomName").notEmpty().withMessage("Room name is required").run(req),
      
        body("checkInTime").matches(/^\d{2}:\d{2}$/).withMessage("Invalid start time format. Use HH:mm").run(req),
        body("checkOutTime").matches(/^\d{2}:\d{2}$/).withMessage("Invalid end time format. Use HH:mm").run(req),
        body("people").isInt({ min: 1 }).withMessage("Number of guests must be at least 1").run(req)
    ]);
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        
        return res.status(400).json({ error: errors.array() });
    }

    try {
        const booking = new RoomBooking(req.body);
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all bookings
export const getAllBookings = async (req, res) => {
    try {  
        
        const bookings = await RoomBooking.find().populate("memberId").populate("roomId").sort({createdAt:-1});
      return  res.status(200).json({success:bookings});
    } catch (error) {
        console.log(error);
        
      return  res.status(500).json({ error: error.message });
    }
};

// Get a single booking by ID
export const getBookingById = async (req, res) => {
    try {
        const booking = await RoomBooking.findById(req.params.id).populate("memberId roomId");
        if (!booking) return res.status(404).json({ error: "Booking not found" });
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a booking with validation
export const updateBooking = async (req, res) => {
    await Promise.all([
        body("checkInDate").optional().isISO8601().withMessage("Invalid check-in date").run(req),
        body("checkOutDate").optional().isISO8601().withMessage("Invalid check-out date").run(req),
        body("checkInTime").optional().matches(/^\d{2}:\d{2}$/).withMessage("Invalid start time format. Use HH:mm").run(req),
        body("checkOutTime").optional().matches(/^\d{2}:\d{2}$/).withMessage("Invalid end time format. Use HH:mm").run(req),
        body("people").optional().isInt({ min: 1 }).withMessage("Number of guests must be at least 1").run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const updatedBooking = await RoomBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBooking) return res.status(404).json({ error: "Booking not found" });
        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
    try {
        const deletedBooking = await RoomBooking.findByIdAndDelete(req.params.id);
        if (!deletedBooking) return res.status(404).json({ error: "Booking not found" });
        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};