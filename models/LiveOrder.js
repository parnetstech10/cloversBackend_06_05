import mongoose from 'mongoose';

const liveOrderSchema = new mongoose.Schema(
  {
    table: {
      type: String,
      required: true,
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      default: 'Preparing',
    },
  },
  { timestamps: true }
);

const LiveOrder = mongoose.model('LiveOrder', liveOrderSchema);

export default LiveOrder;
