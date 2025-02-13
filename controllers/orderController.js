import Order from "../models/orderModel.js"

// Create a new order
export const createOrder = async (req, res) => {
  const { table, items, total } = req.body;

  if (!table || !items || items.length === 0 || !total) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    const order = new Order({ table, items, total });
    await order.save();
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};

// Fetch all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
  }
};

// Fetch an order by ID
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order', details: error.message });
  }
};

// Delete an order
export const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order', details: error.message });
  }
};
