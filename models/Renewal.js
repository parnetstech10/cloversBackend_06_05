// models/Renewal.js (example)
import mongoose from 'mongoose';

const RenewalSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  membershipId: { type: String, required: true },
  membershipName: { type: String, required: true },
  membershipType: { type: String },
  createdAt: { type: Date, default: Date.now },

  qrCode: { type: String }, // will store a data URL (base64)
});

export default mongoose.model('Renewal', RenewalSchema);
