import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true }, // Unique Invoice ID
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true }, // Reference to Member
  amountDue: { type: Number, required: true }, // Amount to be paid
  dueDate: { type: Date, required: true }, // Payment due date
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Overdue"], 
    default: "Pending" 
  }, // Payment status
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);


