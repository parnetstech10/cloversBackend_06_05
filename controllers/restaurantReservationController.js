import RestaurantReservationModel from "../models/restaurantReservationModel.js";
import { getCategoryMapping } from "../utils/menuUtils.js";
import membershipCard from '../models/Renewal.js';
import transactionModel from '../models/transactionModel.js';
// Create a new reservation
const transaction = async (cardId, amount) => {
  try {

    let card = await membershipCard.findById(cardId);
    if (card) {
      card.creditLimit = card.creditLimit - amount;
      await card.save()
      await transactionModel.create({ amount, type: "dr", category: card?.membershipName, description: "Membership Cart payment", user: card.membershipId });
    }

  } catch (error) {
    console.log(error);

  }
}


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


export const createReservationApp = async (req, res) => {
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
      reservationType,
      cardId,
      cardDiscount,
      card
    } = req.body;

    // Get the category mapping
    const categoryMapping = await getCategoryMapping();

    // Filter items by categories
    const foodItems = preOrder.filter(
      item => categoryMapping[item.name] === 'veg' || categoryMapping[item.name] === 'non-veg'
    );
    const alcoholItems = preOrder.filter(item => categoryMapping[item.name] !== 'veg' && categoryMapping[item.name] !== 'non-veg');

    // Create the "food" reservation if there are any food items
    if (foodItems.length > 0) {
      let foodTotal = foodItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const foodReservation = new RestaurantReservationModel({
        // reservationId: `${reservationId}-F`,
        memberId,
        memberName,
        memberPhone,
        memberEmail,
        reservationDate,
        reservationTime,
        numberOfGuests,
        tableNumber,
        preOrder: foodItems.map((item)=>{
        return {
          ...item,
          foodItemId:item?._id,
          foodName:item?.name,
        }
        }),
        totalAmount: foodTotal - (foodTotal * cardDiscount / 100),
        paymentStatus,
        referedBy,
        referedById,
        reservationType: "Restaurant",
        card,
        discount: (foodTotal * cardDiscount / 100),
        cardId
      });
      await foodReservation.save();
    }

    // Create the "alcohol" reservation if there are any alcohol items
    if (alcoholItems.length > 0) {
      let alcoholTotal = alcoholItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const alcoholReservation = new RestaurantReservationModel({
        // reservationId: `${reservationId}-B`,
        memberId,
        memberName,
        memberPhone,
        memberEmail,
        reservationDate,
        reservationTime,
        numberOfGuests,
        tableNumber,
        preOrder:  alcoholItems.map((item)=>{
          return {
            ...item,
            foodItemId:item?._id,
            foodName:item?.name,
          }
          }),
        totalAmount: alcoholTotal - (alcoholTotal * cardDiscount / 100),
        paymentStatus,
        referedBy,
        referedById,
        reservationType: "Bar",
        card,
        discount: (alcoholTotal * cardDiscount / 100),
        cardId
      });
      await alcoholReservation.save();
    }

    // Process transaction if cardId and totalAmount exist
    if (cardId && totalAmount) {
      transaction(cardId, totalAmount);
    }

    res.status(201).json({ message: 'Reservations created successfully' });
  } catch (error) {
    console.error('Error creating reservations:', error);
    res.status(500).json({ message: 'Failed to create reservations', error: error.message });
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
