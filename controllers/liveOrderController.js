import LiveOrder from '../models/LiveOrder.js';
import { getCategoryMapping } from '../utils/menuUtils.js';

// Get all live orders
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
    const { table, items } = req.body;

    // Get the category mapping
    const categoryMapping = await getCategoryMapping();

    // Filter items by categories
    const foodItems = items.filter(
      item => categoryMapping[item.name] === 'veg' || categoryMapping[item.name] === 'non-veg'
    );
    const alcoholItems = items.filter(item => categoryMapping[item.name] === 'alcohol');

    // Create the "food" order if there are any food items
    if (foodItems.length > 0) {
      const foodOrder = new LiveOrder({
        table,
        items: foodItems,
        total: foodItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
      await foodOrder.save();
    }

    // Create the "alcohol" order if there are any alcohol items
    if (alcoholItems.length > 0) {
      const alcoholOrder = new LiveOrder({
        table,
        items: alcoholItems,
        total: alcoholItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      });
      await alcoholOrder.save();
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
  