// models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    // Will be auto-generated
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['cr', 'dr'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// Counter collection for generating sequential transaction IDs
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Pre-save hook to generate and assign transactionId
transactionSchema.pre('save', async function(next) {
  try {
    // Skip if transactionId is already set
    if (this.transactionId) {
      return next();
    }
    
    // Find and update counter, or create if it doesn't exist
    const counter = await Counter.findOneAndUpdate(
      { _id: 'transactionId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    // Format the transaction ID as CLT0001, CLT0002, etc.
    const paddedNumber = counter.seq.toString().padStart(4, '0');
    this.transactionId = `CLT${paddedNumber}`;
    
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('Transaction', transactionSchema);