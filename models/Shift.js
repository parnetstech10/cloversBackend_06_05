import mongoose from "mongoose";

const ShiftSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. Morning
  startTime: { type: String, required: true }, // "08:00"
  endTime: { type: String, required: true },   // "16:00"
  requiredRoles: [
    {
      role: { type: String, required: true }, // e.g. "Waiter"
      count: { type: Number, required: true, default: 1 }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Shift", ShiftSchema);
