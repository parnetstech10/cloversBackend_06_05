import mongoose from "mongoose";

const EmployeeAvailabilitySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  availableDays: [{ type: String }], // ["Monday","Tuesday"]
  unavailableDates: [{ type: String }], // ["2025-10-15"] optional
  preferredShift: { type: String }, // shift name
  role: { type: String }, // store current role for matching if helpful
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("EmployeeAvailability", EmployeeAvailabilitySchema);
