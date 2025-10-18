import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String },
  email: { type: String },
  address: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Supplier', supplierSchema);



