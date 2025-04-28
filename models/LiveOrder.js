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
      required: function() {
        return this.serviceType === 'dining';  
      }
    },
    // Add service type field
    serviceType: {
      type: String,
      enum: ['dining', 'room'],
      required: true,
      default: 'dining'
    },
    // Add room-specific fields
    roomNumber: {
      type: String,
      required: function() {
        return this.serviceType === 'room';  // Only required for room service
      }
    },
    roomName: {
      type: String  // Optional additional info
    },
    // Add room service charge
    roomServiceCharge: {
      type: Number,
      default: 0
    },
    // Add fixed service charge
    fixedServiceCharge: {
      type: Number,
      default: 0
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
