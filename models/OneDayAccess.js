import mongoose from 'mongoose';

const oneDayAccessSchema = new mongoose.Schema(
  {
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
    },
    guestName: {
      type: String,
      required: true,
    },
    accessDate: {
      type: Date,
      required: true,
    },
    areas: [{
      type: String,
    }],
    activities: [{
      type: String,
    }],
    services: [{
      type: String,
    }],
    chargesApplied: {
      type: Boolean,
      default: false,
    },
    totalCharges: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    required: false,
    },
    // POS integration fields
    posTransactionId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet', 'complimentary'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    // Expiry management
    expiresAt: {
      type: Date,
      required: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    // Usage tracking
    areasUsed: [{
      area: String,
      entryTime: Date,
      exitTime: Date,
    }],
    activitiesUsed: [{
      activity: String,
      startTime: Date,
      endTime: Date,
    }],
    servicesUsed: [{
      service: String,
      usedAt: Date,
      quantity: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
oneDayAccessSchema.index({ guestId: 1, accessDate: 1 });
oneDayAccessSchema.index({ expiresAt: 1 });
oneDayAccessSchema.index({ status: 1 });

const OneDayAccess = mongoose.model('OneDayAccess', oneDayAccessSchema);

export default OneDayAccess;









