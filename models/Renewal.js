// models/Renewal.js (example)
import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;

const RenewalSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  membershipId: { type: ObjectId, required: true, ref: "User" },
  membershipName: { type: String, required: true },
  membershipType: { type: String },
  qrCode: { type: String }, // will store a data URL (base64)
  amount: {
    type: Number,
    default: 0
  },
  membershipExpairy: {
    type: Date
  },
  benefit: [],
  payId: {
    type: String
  },
  status: {
    type: String,
    default: "Pending"
  }

}, { timestamps: true });

export default mongoose.model('Renewal', RenewalSchema);
