// models/Guest.js
import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema(
  {
    membershipStatus: { 
      type: String, 
      enum: ["Pending", "Active", "Inactive"], 
      default: "Active" 
    },
    role: { 
      type: String, 
      required: true, 
      default: "Guest",
      enum: ["Guest"] // Only Guest role allowed
    },
    Membership_No: { type: String, required: true }, 
    Mobile_Number: { type: Number, required: true, },
    Guest_Mo_No: { type: Number, required: true, unique: true },
    Member_Name: { type: String, required: true },
    Address: { type: String },
    Slab: { type: Number },
    Full_Amount: { type: Number },
    Remarks: { type: String },
    Ocupation: { type: String },
    DoB: { type: String },
    Blood_Gp: { type: String },
    "Office No": { type: String, default: null },
    // To avoid E11000 error for null values, use partial index via sparse
    Aadhar_No: { type: String, unique: true, sparse: true },
    Pan: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    "C/O": { type: String },
    Photo: { type: String },
    ADHAR: { type: String },
    PAN: { type: String },
    walletBalance: { type: Number, default: 0 },

    isDoc: { type: Boolean, default: false },
    status: { type: String, default: "Active" },    
    // Guest specific fields
    visitDate: { type: Date, default: Date.now },
    sponsoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    validUntil: { type: Date }, // Guest membership validity
    guestType: { 
      type: String, 
      enum: ["Temporary", "Corporate", "VIP"], 
      default: "Temporary" 
    },
    // OTP verification status
    isOtpVerified: { type: Boolean, default: false },
    registrationStatus: {
      type: String,
      enum: ["pending_otp", "verified", "completed"],
      default: "pending_otp"
    }
  },
  {
    timestamps: true,
  }
);

// Index for better performance
guestSchema.index({ Membership_No: 1 });
guestSchema.index({ Mobile_Number: 1 });
guestSchema.index({ validUntil: 1 });
guestSchema.index({ registrationStatus: 1 });

const Guest = mongoose.model('Guest', guestSchema);

export default Guest;