import mongoose from 'mongoose';

const guestOptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['area', 'activity', 'service'],
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    price: {
      type: Number,
      default: 0,
    },
    // For areas - capacity limit
    capacity: {
      type: Number,
      default: null,
    },
    // For activities - duration in minutes
    duration: {
      type: Number,
      default: null,
    },
    // For services - availability
    availability: {
      type: String,
      enum: ['available', 'unavailable', 'limited'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for type and name
guestOptionSchema.index({ type: 1, name: 1 }, { unique: true });

const GuestOption = mongoose.model('GuestOption', guestOptionSchema);

export default GuestOption;









