import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const liveOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true
    },
    table: {
      type: String,
      required: true,
    },
    userId: {
      type: ObjectId,
      ref: "User"
    },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        measure: {
          type: String
        },
        image: { type: String }
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
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      default: "card",
    },
  },
  { timestamps: true }
);

// Auto-generate orderId before saving
liveOrderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model("LiveOrder").countDocuments();
    this.orderId = `CLO${String(count + 1).padStart(3, '0')}`; // Generates CLO001, CLO002...
  }
  next();
});

const LiveOrder = mongoose.model('LiveOrder', liveOrderSchema);

export default LiveOrder;
