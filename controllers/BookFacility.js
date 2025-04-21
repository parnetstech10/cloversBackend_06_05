
import BookFacilityModel from "../models/BookFacility.js";

// Create a new booking
export const createBookfacility = async (req, res) => {
  try {
    // Check for useeId in the request body (from your frontend) and map it to userId
    if (req.body.useeId) {
      req.body.userId = req.body.useeId;
      delete req.body.useeId;
    }

    const newBooking = new BookFacilityModel(req.body);
    const savedBooking = await newBooking.save();
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get all bookings
export const getAllBookfacility = async (req, res) => {
  try {
    // const bookings = await BookFacilityModel.find();
    const bookings = await BookFacilityModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get bookings by user ID
export const getUserBookfacility = async (req, res) => {
  try {
    const bookings = await BookFacilityModel.find({ userId: req.params.userId });
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings',
      error: error.message
    });
  }
};

// Get booking by ID
export const getBookfacilityById = async (req, res) => {
  try {
    const booking = await BookFacilityModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// Update booking status
export const updateBookfacilityStatus = async (req, res) => {
  try {
    const updatedBooking = await BookFacilityModel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedBooking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update booking',
      error: error.message
    });
  }
};

// Delete booking
export const deleteBookfacility = async (req, res) => {
  try {
    const booking = await BookFacilityModel.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
};