import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    membershipStatus: { type: String, enum: ["Pending", "Active", "Inactive"] },
    role: { type: String, required: true, enum: ["Member", "Admin", "Guest"] },
    App_No: { type: Number, required: true },
    Membership_No: { type: String },
    Member_Name: { type: String, required: true },
    "A to Z": { type: String },
    Mobile_Number: { type: Number, required: true, unique: true },
    Address: { type: String },
    Slab: { type: Number },
    Full_Amount: { type: Number },
    Remarks: { type: String },
    Ocupation: { type: String },
    DoB: { type: String },
    Blood_Gp: { type: String },
    "Phone No": { type: Number },
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
    profileImage: { type: String },
    status: { type: String },
    password: { type: String }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
