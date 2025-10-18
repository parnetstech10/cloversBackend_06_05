import LeaveManagement from "../models/LeaveManagement.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

// Create new leave request
export const createLeaveRequest = async (req, res) => {
  try {
    const {
      employeeId,
      leaveType,
      leaveReason,
      startDate,
      endDate,
      isHalfDay,
      halfDayType,
      dailySalary,
      isPaidLeave,
      comments,
      supportingDocuments
    } = req.body;

    // Validate required fields
    if (!employeeId || !leaveType || !leaveReason || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: employeeId, leaveType, leaveReason, startDate, endDate' 
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveManagement.findOne({
      employeeId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({ 
        error: 'You already have a leave request for this period' 
      });
    }

    // Create leave request
    const leaveRequest = new LeaveManagement({
      employeeId,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department,
      position: employee.position,
      leaveType,
      leaveReason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isHalfDay,
      halfDayType,
      dailySalary: dailySalary || employee.dailySalary || 0,
      isPaidLeave: isPaidLeave !== false, // Default to true
      comments,
      supportingDocuments: supportingDocuments || []
    });

    await leaveRequest.save();

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create leave request' 
    });
  }
};

// Get all leave requests with filters
export const getAllLeaveRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      leaveType,
      department,
      employeeId,
      startDate,
      endDate,
      search
    } = req.query;

    let query = {};

    // Apply filters
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (department) query.department = department;
    if (employeeId) query.employeeId = employeeId;
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { leaveReason: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const leaveRequests = await LeaveManagement.find(query)
      .populate('employeeId', 'name email department position')
      .populate('approvedBy', 'Member_Name username name email')
      .sort({ appliedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LeaveManagement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: leaveRequests,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch leave requests' 
    });
  }
};

// Get single leave request
export const getLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const leaveRequest = await LeaveManagement.findById(id)
      .populate('employeeId', 'name email department position')
      .populate('approvedBy', 'Member_Name username name email');

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.status(200).json({
      success: true,
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error fetching leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch leave request' 
    });
  }
};

// Approve leave request
export const approveLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const approvedBy = req.user._id;
    const approvedByName = req.user.Member_Name || req.user.username || req.user.name;

    const leaveRequest = await LeaveManagement.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ 
        error: 'Only pending leave requests can be approved' 
      });
    }

    await leaveRequest.approve(approvedBy, approvedByName, adminNotes);

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to approve leave request' 
    });
  }
};

// Reject leave request
export const rejectLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const approvedBy = req.user._id;
    const approvedByName = req.user.Member_Name || req.user.username || req.user.name;

    const leaveRequest = await LeaveManagement.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ 
        error: 'Only pending leave requests can be rejected' 
      });
    }

    await leaveRequest.reject(rejectionReason, approvedBy, approvedByName);

    res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to reject leave request' 
    });
  }
};

// Cancel leave request
export const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveManagement.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status === 'Approved') {
      return res.status(400).json({ 
        error: 'Approved leave requests cannot be cancelled' 
      });
    }

    await leaveRequest.cancel();

    res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error cancelling leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to cancel leave request' 
    });
  }
};

// Get employee leave balance
export const getEmployeeLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year } = req.query;

    const leaveBalance = await LeaveManagement.getEmployeeLeaveBalance(
      employeeId, 
      year ? parseInt(year) : new Date().getFullYear()
    );

    res.status(200).json({
      success: true,
      data: leaveBalance
    });

  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch leave balance' 
    });
  }
};

// Get department leave statistics
export const getDepartmentLeaveStats = async (req, res) => {
  try {
    const { department } = req.params;
    const { year } = req.query;

    const stats = await LeaveManagement.getDepartmentLeaveStats(
      department,
      year ? parseInt(year) : new Date().getFullYear()
    );

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching department leave stats:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch department leave stats' 
    });
  }
};

// Get pending approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingApprovals = await LeaveManagement.getPendingApprovals();

    res.status(200).json({
      success: true,
      data: pendingApprovals
    });

  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch pending approvals' 
    });
  }
};

// Get leave history for employee
export const getEmployeeLeaveHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit } = req.query;

    const leaveHistory = await LeaveManagement.getLeaveHistory(
      employeeId, 
      limit ? parseInt(limit) : 50
    );

    res.status(200).json({
      success: true,
      data: leaveHistory
    });

  } catch (error) {
    console.error('Error fetching leave history:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch leave history' 
    });
  }
};

// Update leave request
export const updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.status;
    delete updateData.approvedBy;
    delete updateData.approvedDate;
    delete updateData.payrollProcessed;

    const leaveRequest = await LeaveManagement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Leave request updated successfully',
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update leave request' 
    });
  }
};

// Delete leave request
export const deleteLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const leaveRequest = await LeaveManagement.findById(id);
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status === 'Approved') {
      return res.status(400).json({ 
        error: 'Approved leave requests cannot be deleted' 
      });
    }

    await LeaveManagement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Leave request deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting leave request:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete leave request' 
    });
  }
};

// Get leave statistics for dashboard
export const getLeaveStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const stats = await LeaveManagement.aggregate([
      {
        $match: {
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalDays: { $sum: '$totalDays' },
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

    const leaveTypeStats = await LeaveManagement.aggregate([
      {
        $match: {
          startDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
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

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalRequests: 0,
          totalDays: 0,
          totalDeductions: 0,
          approvedRequests: 0,
          pendingRequests: 0,
          rejectedRequests: 0
        },
        byLeaveType: leaveTypeStats
      }
    });

  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch leave statistics' 
    });
  }
};

