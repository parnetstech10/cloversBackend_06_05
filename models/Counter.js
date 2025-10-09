import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // sequence name, e.g., 'appNo', 'membershipNo'
  seq: { type: Number, default: 0 },
});

// Reuse model if already compiled to avoid OverwriteModelError in ESM reloads
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

export async function getNextSequence(sequenceName) {
  const updated = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return updated.seq;
}

export default Counter;

