import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  table: { type: Number, required: true },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
