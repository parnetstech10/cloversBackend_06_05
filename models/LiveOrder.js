import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const liveOrderSchema = new mongoose.Schema(
  {
    table: {
      type: String,
      required: true,
    },
    userId:{
      type:ObjectId,
      ref:"User"
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
    card: {
      type: String
    },
    category: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0
    },
    cardId: {
      type: ObjectId
    },
    status: {
      type: String,
      default: 'Preparing',
    },
    card: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: "Inpogress",
    },
  },
  { timestamps: true }
);

const LiveOrder = mongoose.model('LiveOrder', liveOrderSchema);

export default LiveOrder;
