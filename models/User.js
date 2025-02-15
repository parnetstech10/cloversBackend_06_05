import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    membershipStatus: { type: String, required: true, enum: ["Pending", "Active", "Inactive"] },
    role: { type: String, required: true, enum: ["Member", "Admin", "Guest"] },
    App_No: { type: Number, required: true },
    Membership_No: { type: String, required: true, unique: true },
    Member_Name: { type: String, required: true },
    "A to Z": { type: String },
    Mobile_Number: { type: Number, required: true, unique: true },
    Address: { type: String, },
    Slab: { type: Number, },
    Full_Amount: { type: Number, },
    Remarks: { type: String },
    Ocupation: { type: String },
    DoB: { type: String, required: true },
    Blood_Gp: { type: String },
    "Phone No": { type: Number },
    "Office No": { type: Number, default: null },
    Aadhar_No: { type: String, unique: true },
    Pan: { type: String, unique: true },
    email: { type: String, unique: true },
    "C/O": { type: String },
    Photo: { type: String, },
    ADHAR: { type: String, },
    PAN: { type: String, },
    // Add any additional fields needed
    isDoc: {
      type: Boolean,
      default: false
    },
    password: { type: String }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
