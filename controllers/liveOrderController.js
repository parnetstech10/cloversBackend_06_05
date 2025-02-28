import LiveOrder from '../models/LiveOrder.js';
import { getCategoryMapping } from '../utils/menuUtils.js';
import membershipCard from '../models/Renewal.js';
import transactionModel from '../models/transactionModel.js';
// Get all live orders

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

export const getLiveOrders = async (req, res) => {
  try {
    const orders = await LiveOrder.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch live orders', error: err });
  }
};

// Create a new live order
export const createLiveOrder = async (req, res) => {
  try {
    const { table, items, card, userId, cardId, total, carddiscount } = req.body;

    // Get the category mapping
    const categoryMapping = await getCategoryMapping();

    // Filter items by categories
    const foodItems = items.filter(
      item => categoryMapping[item.name] === 'veg' || categoryMapping[item.name] === 'non-veg'
    );
    const alcoholItems = items.filter(item => categoryMapping[item.name] === 'alcohol');

    // Create the "food" order if there are any food items
    if (foodItems.length > 0) {
      let foodtotal = foodItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const foodOrder = new LiveOrder({
        table,
        items: foodItems,
        category: "resturant",
        total: foodtotal - (foodtotal * carddiscount / 100),
        card, discount: (foodtotal * carddiscount / 100), cardId, userId

      });
      await foodOrder.save();
    }

    // Create the "alcohol" order if there are any alcohol items
    if (alcoholItems.length > 0) {
      let alcoholprice = alcoholItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const alcoholOrder = new LiveOrder({
        table,
        items: alcoholItems,
        category: "bar",
        total: alcoholprice - (alcoholItems * carddiscount / 100),
        card, discount: (alcoholItems * carddiscount / 100), cardId, userId
      });
      await alcoholOrder.save();
    }
    if (cardId && total) {
      transaction(cardId, total,)
    }
    res.status(201).json({ message: 'Orders created successfully' });
  } catch (err) {
    console.error('Error creating live orders:', err);
    res.status(500).json({ message: 'Failed to create live orders', error: err });
  }
};

// Update live order status (e.g., to "Served")
export const updateLiveOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await LiveOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update live order status', error: err });
  }
};

export const getAllLiveorderbycat = async (req, res) => {
  try {
    let cat = req.params.cat;
    let data = await LiveOrder.find({ category: cat }).sort({ _id: -1 });
    return res.status(200).json({ success: data });
  } catch (error) {
    console.log(error);

  }
}

// Move live order to history orders
export const moveOrderToHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await LiveOrder.findById(id);

    // Save to history orders
    const historyOrder = new HistoryOrder({ ...order.toObject() });
    await historyOrder.save();

    // Remove from live orders
    await LiveOrder.findByIdAndDelete(id);

    res.status(200).json({ message: 'Order moved to history' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to move order to history', error: err });
  }
};

// Delete a live order
export const deleteLiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await LiveOrder.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Live order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete live order', error: err });
  }
};
