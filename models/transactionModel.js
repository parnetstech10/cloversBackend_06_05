// models/Transaction.js
import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

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
    // enum: ['cr', 'dr'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Pre-save hook to generate and assign transactionId
transactionSchema.pre('save', async function(next) {
  try {
    // Skip if transactionId is already set
    if (this.transactionId) {
      return next();
    }
    
    // Get next sequence atomically via shared Counter model
    const seq = await getNextSequence('transactionId');
    
    // Format the transaction ID as CLT0001, CLT0002, etc.
    const paddedNumber = seq.toString().padStart(4, '0');
    this.transactionId = `CLT${paddedNumber}`;
    
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('Transaction', transactionSchema);