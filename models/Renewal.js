// models/Renewal.js
import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const RenewalSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  membershipId: { type: ObjectId, required: true, ref: "User" },
  membershipName: { type: String, required: true },
  membershipType: { 
    type: ObjectId, 
    ref: "MembershipType",
    required: false 
  },
  membershipTypeName: { type: String, required: true }, // Store name for easy access
  qrCode: { type: String }, // will store a data URL (base64)
  amount: {
    type: Number,
    default: 0
  },
  renewalPeriod: {
    label: { type: String }, // e.g., "6 Months", "1 Year"
    days: { type: Number }, // e.g., 180, 365
    price: { type: Number }
  },
  membershipExpairy: {
    type: Date
  },
  benefit: [],
  payId: {
    type: String
  },
  creditLimit:{
    type: Number,
  },
  discount:{
    type: Number,
    default:0
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Active', 'Expired', 'Cancelled'],
    default: "Pending"
  },
  // Firebase-specific fields
  fcmToken: { type: String },
  autoRenewal: { type: Boolean, default: false },
  paymentMethodId: { type: String },
  notificationSent: { type: Boolean, default: false },
  lastNotificationDate: { type: Date },
  notificationDays: [{ type: Number }], // Days before expiry when notifications were sent
  transactionId: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  renewalType: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual'
  },
  expiryNotifications: [{
    sentDate: { type: Date },
    daysBeforeExpiry: { type: Number },
    notificationType: { type: String },
    messageId: { type: String }
  }],
  // Renewal history tracking
  previousMembershipType: { type: ObjectId, ref: "MembershipType" },
  renewalReason: { type: String }, // e.g., "upgrade", "downgrade", "same_type"
  isUpgrade: { type: Boolean, default: false },
  isDowngrade: { type: Boolean, default: false }

}, { timestamps: true });

// Indexes for better performance
RenewalSchema.index({ membershipId: 1 });
RenewalSchema.index({ status: 1 });
RenewalSchema.index({ membershipExpairy: 1 });
RenewalSchema.index({ membershipType: 1 });

export default mongoose.model('Renewal', RenewalSchema);
