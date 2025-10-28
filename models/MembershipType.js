// models/MembershipType.js
import mongoose from 'mongoose';

const MembershipTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  renewalPeriods: [{
    label: {
      type: String,
      required: true
    },
    days: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    }
  }],
  benefits: [{
    name: String,
    description: String,
    value: String
  }],
  creditLimit: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
MembershipTypeSchema.index({ name: 1 });
MembershipTypeSchema.index({ isActive: 1 });

const MembershipType = mongoose.model('MembershipType', MembershipTypeSchema);

export default MembershipType;







