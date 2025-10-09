import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  leaveType: { type: String, required: true },
  leaveDuration: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
  appliedAt: { type: Date, default: Date.now },
});

const LeaveModel = mongoose.model("Leave", leaveSchema);

export default LeaveModel;
