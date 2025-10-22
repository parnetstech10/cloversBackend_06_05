import LeaveModel from "../models/LeaveModel.js";
import Employee from "../models/employeeModel.js";

export const applyLeave = async (req, res) => {
  console.log("Apply leave request body:", req.body);
  
  const { 
    employeeId, 
    fromDate, 
    toDate, 
    leaveType, 
    leaveReason,
    isHalfDay,
    halfDayType,
    dailySalary,
    isPaidLeave,
    comments,
    supportingDocuments
  } = req.body;

  if (!employeeId || !fromDate || !toDate || !leaveType || !leaveReason) {
    console.log("Missing required fields:", { employeeId, fromDate, toDate, leaveType, leaveReason });
    return res.status(400).json({ success: false, message: "All required fields must be provided" });
  }

  try {
    console.log("Looking for employee with ID:", employeeId);
    // Get employee details
    const employee = await Employee.findById(employeeId);
    console.log("Employee found:", employee);
    
    if (!employee) {
      console.log("Employee not found for ID:", employeeId);
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveModel.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        {
          fromDate: { $lte: new Date(toDate) },
          toDate: { $gte: new Date(fromDate) }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have a leave request for this period" 
      });
    }

    const leaveData = {
      employeeId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      leaveType,
      leaveReason,
      isHalfDay: isHalfDay || false,
      halfDayType,
      dailySalary: dailySalary || employee.dailySalary || 0,
      isPaidLeave: isPaidLeave !== false, // Default to true
      comments,
      supportingDocuments: supportingDocuments || []
    };
    
    console.log("Creating leave with data:", leaveData);
    
    const leave = new LeaveModel(leaveData);
    console.log("Leave model created:", leave);

    const savedLeave = await leave.save();
    console.log("Leave saved successfully:", savedLeave);
    
    res.status(201).json({ success: true, data: savedLeave });
  } catch (error) {
    console.error("Error creating leave request:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};

// Get all leave applications
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveModel.find().populate("employeeId", "name email");
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get leave applications for a single employee
export const getEmployeeLeaves = async (req, res) => {
  const { employeeId } = req.params;
  try {
    const leaves = await LeaveModel.find({ employeeId });

     // Calculate stats
    const upcoming = leaves.filter(leave =>
      leave.status === 'Pending' ||
      (new Date(leave.fromDate) > new Date() && leave.status === 'Approved')
    ).length;

    const past = leaves.filter(leave =>
      new Date(leave.toDate) < new Date() && leave.status === 'Approved'
    ).length;

     const rejected = leaves.filter(leave => leave.status === 'Rejected').length;

res.status(200).json({ 
      success: true, 
      data: {
        leaves,
        stats: { upcoming, past, rejected }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update leave status (Approve/Reject)
export const updateLeaveStatus = async (req, res) => {
  const { leaveId } = req.params;
  const { status, rejectionReason, adminNotes } = req.body;
  const approvedBy = req.user._id;
  const approvedByName = req.user.Member_Name || req.user.username || req.user.name;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const leave = await LeaveModel.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ 
        success: false, 
        message: "Only pending leave requests can be updated" 
      });
    }

    if (status === 'Approved') {
      await leave.approve(approvedBy, approvedByName, adminNotes);
    } else if (status === 'Rejected') {
      if (!rejectionReason) {
        return res.status(400).json({ 
          success: false, 
          message: "Rejection reason is required" 
        });
      }
      await leave.reject(rejectionReason, approvedBy, approvedByName);
    }

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get pending approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingApprovals = await LeaveModel.getPendingApprovals();
    res.status(200).json({ success: true, data: pendingApprovals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get leave statistics for dashboard
export const getLeaveStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const stats = await LeaveModel.getLeaveStatistics(currentYear);
    
    // Get leave type breakdown
    const leaveTypeStats = await LeaveModel.aggregate([
      {
        $match: {
          fromDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          totalDays: { $sum: '$leaveDuration' },
          totalRequests: { $sum: 1 },
          totalDeductions: { $sum: '$totalDeduction' }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        overall: stats,
        byLeaveType: leaveTypeStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get employee leave balance
export const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    const leaveBalance = await LeaveModel.getEmployeeLeaveBalance(employeeId, currentYear);
    res.status(200).json({ success: true, data: leaveBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leave = await LeaveModel.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    if (leave.status === 'Approved') {
      return res.status(400).json({ 
        success: false, 
        message: "Approved leave requests cannot be cancelled" 
      });
    }

    await leave.cancel();
    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get leaves for payroll processing
export const getLeavesForPayroll = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: "Month and year are required" 
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const leaves = await LeaveModel.find({
      status: 'Approved',
      payrollProcessed: false,
      fromDate: { $lte: endDate },
      toDate: { $gte: startDate }
    }).populate('employeeId', 'name email department position');

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark leave as processed in payroll
export const markLeaveProcessed = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { payrollMonth, payrollYear } = req.body;

    const leave = await LeaveModel.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    leave.payrollProcessed = true;
    leave.payrollMonth = payrollMonth;
    leave.payrollYear = payrollYear;
    
    await leave.save();
    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update leave request
export const updateLeaveRequest = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const updateData = req.body;

    console.log("Update leave request:", { leaveId, updateData });

    // Find the leave request
    const leaveRequest = await LeaveModel.findById(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    // Calculate duration if dates are being updated
    if (updateData.fromDate || updateData.toDate) {
      const fromDate = updateData.fromDate || leaveRequest.fromDate;
      const toDate = updateData.toDate || leaveRequest.toDate;
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      updateData.leaveDuration = diffDays;
    }

    // Update the leave request
    const updatedLeave = await LeaveModel.findByIdAndUpdate(
      leaveId,
      updateData,
      { new: true, runValidators: true }
    ).populate('employeeId', 'name email department position');

    console.log("Leave request updated successfully:", updatedLeave);

    res.status(200).json({
      success: true,
      message: "Leave request updated successfully",
      data: updatedLeave
    });

  } catch (error) {
    console.error("Error updating leave request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
