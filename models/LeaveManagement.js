import mongoose from "mongoose";

// Leave Management Schema
const LeaveManagementSchema = new mongoose.Schema({
  // Employee details
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeEmail: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },

  // Leave details
  leaveType: {
    type: String,
    enum: ['Sick Leave', 'Annual Leave', 'Personal Leave', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Unpaid Leave'],
    required: true
  },
  leaveReason: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0.5 // Allow half days
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['First Half', 'Second Half'],
    default: null
  },

  // Financial impact
  dailySalary: {
    type: Number,
    required: true,
    min: 0
  },
  totalDeduction: {
    type: Number,
    required: true,
    min: 0
  },
  isPaidLeave: {
    type: Boolean,
    default: true
  },

  // Status and approval
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin/Manager who approved
  },
  approvedByName: {
    type: String
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },

  // Supporting documents
  supportingDocuments: [{
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Comments and notes
  comments: {
    type: String
  },
  adminNotes: {
    type: String
  },

  // Payroll integration
  payrollProcessed: {
    type: Boolean,
    default: false
  },
  payrollMonth: {
    type: String // Format: "YYYY-MM"
  },
  payrollYear: {
    type: Number
  },

}, { timestamps: true });

// Pre-save middleware to calculate total days and deductions
LeaveManagementSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const timeDiff = this.endDate.getTime() - this.startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
    
    // Handle half days
    if (this.isHalfDay) {
      this.totalDays = 0.5;
    } else {
      this.totalDays = daysDiff;
    }

    // Calculate deduction
    if (!this.isPaidLeave) {
      this.totalDeduction = this.totalDays * this.dailySalary;
    } else {
      this.totalDeduction = 0;
    }
  }
  next();
});

// Static methods
LeaveManagementSchema.statics.getEmployeeLeaveBalance = async function(employeeId, year = new Date().getFullYear()) {
  const employee = await this.findOne({ employeeId });
  if (!employee) return null;

  // Get all approved leaves for the year
  const approvedLeaves = await this.find({
    employeeId,
    status: 'Approved',
    startDate: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });

  // Calculate total leave days taken by type
  const leaveSummary = {};
  approvedLeaves.forEach(leave => {
    if (!leaveSummary[leave.leaveType]) {
      leaveSummary[leave.leaveType] = 0;
    }
    leaveSummary[leave.leaveType] += leave.totalDays;
  });

  return leaveSummary;
};

LeaveManagementSchema.statics.getDepartmentLeaveStats = async function(department, year = new Date().getFullYear()) {
  const stats = await this.aggregate([
    {
      $match: {
        department,
        startDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      }
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$totalDays' },
        totalRequests: { $sum: 1 },
        totalDeductions: { $sum: '$totalDeduction' }
      }
    }
  ]);

  return stats;
};

LeaveManagementSchema.statics.getPendingApprovals = function() {
  return this.find({ status: 'Pending' })
    .populate('employeeId', 'name email department position')
    .sort({ appliedDate: -1 });
};

LeaveManagementSchema.statics.getLeaveHistory = function(employeeId, limit = 50) {
  return this.find({ employeeId })
    .sort({ appliedDate: -1 })
    .limit(limit);
};

// Instance methods
LeaveManagementSchema.methods.approve = function(approvedBy, approvedByName, adminNotes = '') {
  this.status = 'Approved';
  this.approvedBy = approvedBy;
  this.approvedByName = approvedByName;
  this.approvedDate = new Date();
  this.adminNotes = adminNotes;
  return this.save();
};

LeaveManagementSchema.methods.reject = function(rejectionReason, approvedBy, approvedByName) {
  this.status = 'Rejected';
  this.rejectionReason = rejectionReason;
  this.approvedBy = approvedBy;
  this.approvedByName = approvedByName;
  this.approvedDate = new Date();
  return this.save();
};

LeaveManagementSchema.methods.cancel = function() {
  this.status = 'Cancelled';
  return this.save();
};

// Create model
const LeaveManagement = mongoose.model('LeaveManagement', LeaveManagementSchema);

export default LeaveManagement;

