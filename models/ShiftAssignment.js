import mongoose from "mongoose";

const ShiftAssignmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: true },
  assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  createdAt: { type: Date, default: Date.now }
});

ShiftAssignmentSchema.index({ date: 1, shiftId: 1 }, { unique: true });

export default mongoose.model("ShiftAssignment", ShiftAssignmentSchema);
