import RestaurantReservationModel from "../models/restaurantReservationModel.js";

// Create a new reservation
export const createReservation = async (req, res) => {
  try {
    const {
      reservationId,
      memberId,
      memberName,
      memberPhone,
      memberEmail,
      reservationDate,
      reservationTime,
      numberOfGuests,
      tableNumber,
      preOrder,
      totalAmount,
      paymentStatus,
      referedBy,
      referedById,
      reservationType
    } = req.body;

    const newReservation = new RestaurantReservationModel({
      reservationId,
      memberId,
      memberName,
      memberPhone,
      memberEmail,
      reservationDate,
      reservationTime,
      numberOfGuests,
      tableNumber,
      preOrder,
      totalAmount,
      paymentStatus,
      referedBy,
      referedById,
      reservationType
    });

    await newReservation.save();
    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: newReservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating reservation",
      error: error.message,
    });
  }
};

// Get all reservations
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await RestaurantReservationModel.find()
      .populate("memberId")
      .populate("preOrder.foodItemId");

    res.status(200).json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reservations",
      error: error.message,
    });
  }
};

// Get a reservation by ID
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await RestaurantReservationModel.findById(id)
      .populate("memberId")
      .populate("preOrder.foodItemId");

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching reservation",
      error: error.message,
    });
  }
};

// Update reservation status (Confirm, Cancel, Complete)
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await RestaurantReservationModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Reservation status updated",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating reservation status",
      error: error.message,
    });
  }
};

// Update Payment Status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const reservation = await RestaurantReservationModel.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message,
    });
  }
};

// Delete a reservation
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await RestaurantReservationModel.findByIdAndDelete(id);

    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Reservation deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting reservation",
      error: error.message,
    });
  }
};
