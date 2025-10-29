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
        // Prevent double-booking: same room, same date, overlapping time
        const { roomId, checkInDate, checkOutDate, checkInTime, checkOutTime } = req.body;

        const toStartOfDay = (d) => {
            const dt = new Date(d);
            dt.setHours(0,0,0,0);
            return dt;
        };
        const toEndOfDay = (d) => {
            const dt = new Date(d);
            dt.setHours(23,59,59,999);
            return dt;
        };
        const parseDateLocal = (d) => {
            // Accept Date object or 'YYYY-MM-DD' string; always build local date
            if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const s = String(d || '').trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
                const [Y, M, D] = s.split('-').map(Number);
                return new Date(Y, (M || 1) - 1, D || 1);
            }
            const dt = new Date(s);
            return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        };
        const combineDateTime = (date, hhmm) => {
            const [h, m] = String(hhmm || '00:00').split(':').map(Number);
            const base = parseDateLocal(date);
            base.setHours(h || 0, m || 0, 0, 0);
            return base;
        };

        const desiredStart = combineDateTime(checkInDate, checkInTime);
        const desiredEnd = combineDateTime(checkOutDate || checkInDate, checkOutTime);
        if (!(desiredStart < desiredEnd)) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        // Fetch existing bookings for same room (date-only check)
        const sameRoomBookings = await RoomBooking.find({
            roomId,
            status: { $nin: ['cancelled'] }
        });

        const selectedDayTs = parseDateLocal(checkInDate).getTime();
        const dateTaken = sameRoomBookings.some(b => {
            if (!b.checkInDate) return false;
            return parseDateLocal(b.checkInDate).getTime() === selectedDayTs;
        });

        if (dateTaken) {
            return res.status(409).json({ error: 'This room is already booked for the selected date. Please choose a different date or room.' });
        }

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
        // Prevent conflicts when updating (date-only)
        const current = await RoomBooking.findById(req.params.id);
        if (!current) return res.status(404).json({ error: 'Booking not found' });

        const next = { ...current.toObject(), ...req.body };

        const normalize = (d) => {
            const dt = new Date(d);
            return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        };
        const nextDateTs = normalize(next.checkInDate || current.checkInDate).getTime();

        const others = await RoomBooking.find({
            _id: { $ne: current._id },
            roomId: next.roomId || current.roomId,
            status: { $nin: ['cancelled'] }
        });

        const sameDateExists = others.some(b => b.checkInDate && normalize(b.checkInDate).getTime() === nextDateTs);
        if (sameDateExists) {
            return res.status(409).json({ error: 'This room is already booked for the selected date. Please choose a different date or room.' });
        }

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