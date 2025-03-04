import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  reservationId: {
    type: String,
    unique: true,
  },
  reservationType:{
    type: String,
    enum: ["Restaurant", "Bar"],
    default: "Pending",
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  memberName: {
    type: String,
  },
  memberPhone: {
    type: String,
  },
  memberEmail: {
    type: String,
  },
  reservationDate: {
    type: Date,
  },
  reservationTime: {
    type: String, // Example: "7:30 PM"
  },
  numberOfGuests: {
    type: Number,
  },
  tableNumber: {
    type: String, // Example: "Table 5"
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
    default: "Pending",
  },
  preOrder: [
    {
      foodItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
      },
      foodName: {
        type: String,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
      },
      specialInstructions: {
        type: String,
      },
    },
  ],
  totalAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    // enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
  referedBy: {
    type: String,
  },
  referedById: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to auto-generate reservationId
reservationSchema.pre("save", async function (next) {
  if (!this.reservationId) {
    const lastReservation = await mongoose.model("RestaurantReservation").findOne().sort({ _id: -1 });
    let newId = "CLCMRES001"; // Default for first reservation

    if (lastReservation && lastReservation.reservationId) {
      const lastIdMatch = lastReservation.reservationId.match(/^CLCMRES(\d+)$/); // Match and extract number
      const lastIdNumber = lastIdMatch ? parseInt(lastIdMatch[1], 10) : 0; // Extract number or default to 0

      newId = `CLCMRES${String(lastIdNumber + 1).padStart(3, "0")}`; // Increment and format
    }

    this.reservationId = newId;
  }
  next();
});

const RestaurantReservationModel = mongoose.model('RestaurantReservation', reservationSchema);

export default RestaurantReservationModel;
