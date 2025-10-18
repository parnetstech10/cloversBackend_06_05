import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  leaveType: { 
    type: String, 
    enum: ['Sick Leave', 'Annual Leave', 'Personal Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Unpaid Leave'],
    required: true 
  },
  leaveDuration: { type: Number, default: 0 },
  leaveReason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected", "Cancelled"], default: "Pending" },
  appliedAt: { type: Date, default: Date.now },
  
  // Enhanced fields for payroll integration
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['First Half', 'Second Half'], default: null },
  
  // Financial impact
  dailySalary: { type: Number, default: 0 },
  totalDeduction: { type: Number, default: 0 },
  isPaidLeave: { type: Boolean, default: true },
  
  // Approval details
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: { type: String },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
  
  // Payroll integration
  payrollProcessed: { type: Boolean, default: false },
  payrollMonth: { type: String }, // Format: "YYYY-MM"
  payrollYear: { type: Number },
  
  // Supporting documents
  supportingDocuments: [{
    fileName: String,
    filePath: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  comments: { type: String }
}, { timestamps: true });

// Pre-save middleware to calculate deductions
leaveSchema.pre('save', function(next) {
  console.log("Pre-save middleware - fromDate:", this.fromDate, "toDate:", this.toDate);
  
  if (this.fromDate && this.toDate) {
    const timeDiff = this.toDate.getTime() - this.fromDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both dates
    
    console.log("Pre-save middleware - timeDiff:", timeDiff, "daysDiff:", daysDiff);
    
    // Handle half days
    if (this.isHalfDay) {
      this.leaveDuration = 0.5;
      console.log("Pre-save middleware - half day leave, duration:", this.leaveDuration);
    } else {
      this.leaveDuration = daysDiff;
      console.log("Pre-save middleware - full day leave, duration:", this.leaveDuration);
    }

    // Calculate deduction
    if (!this.isPaidLeave) {
      this.totalDeduction = this.leaveDuration * this.dailySalary;
      console.log("Pre-save middleware - unpaid leave, deduction:", this.totalDeduction);
    } else {
      this.totalDeduction = 0;
      console.log("Pre-save middleware - paid leave, no deduction");
    }
  } else {
    console.log("Pre-save middleware - missing dates, skipping calculation");
  }
  next();
});

// Instance methods
leaveSchema.methods.approve = function(approvedBy, approvedByName, adminNotes = '') {
  this.status = 'Approved';
  this.approvedBy = approvedBy;
  this.approvedByName = approvedByName;
  this.approvedAt = new Date();
  this.adminNotes = adminNotes;
  return this.save();
};

leaveSchema.methods.reject = function(rejectionReason, approvedBy, approvedByName) {
  this.status = 'Rejected';
  this.rejectionReason = rejectionReason;
  this.approvedBy = approvedBy;
  this.approvedByName = approvedByName;
  this.approvedAt = new Date();
  return this.save();
};

leaveSchema.methods.cancel = function() {
  this.status = 'Cancelled';
  return this.save();
};

// Static methods
leaveSchema.statics.getEmployeeLeaveBalance = async function(employeeId, year = new Date().getFullYear()) {
  const approvedLeaves = await this.find({
    employeeId,
    status: 'Approved',
    fromDate: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });

  const leaveSummary = {};
  approvedLeaves.forEach(leave => {
    if (!leaveSummary[leave.leaveType]) {
      leaveSummary[leave.leaveType] = 0;
    }
    leaveSummary[leave.leaveType] += leave.leaveDuration;
  });

  return leaveSummary;
};

leaveSchema.statics.getPendingApprovals = function() {
  return this.find({ status: 'Pending' })
    .populate('employeeId', 'name email department position')
    .sort({ appliedAt: -1 });
};

leaveSchema.statics.getLeaveStatistics = async function(year = new Date().getFullYear()) {
  const stats = await this.aggregate([
    {
      $match: {
        fromDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalDays: { $sum: '$leaveDuration' },
        totalDeductions: { $sum: '$totalDeduction' },
        approvedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
        },
        pendingRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        rejectedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalRequests: 0,
    totalDays: 0,
    totalDeductions: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0
  };
};

const LeaveModel = mongoose.model("Leave", leaveSchema);

export default LeaveModel;
