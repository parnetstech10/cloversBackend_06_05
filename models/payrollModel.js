import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  attendanceData: {
    type: Number,
    default: 0
  },
  taxDeductions: {
    type: Number,
    default: 0
  },
  advancePayment: {
    type: Number,
    default: 0
  },
  advanceDeduction: {
    type: Number,
    default: 0
  },
  remainingAdvance: {
    type: Number,
    default: 0
  },
  deductionMonths: {
    type: Number,
    default: 1
  },
  netSalary: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  },
  remainingMonths: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

// Compound index to prevent duplicate entries for the same employee in the same month/year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);