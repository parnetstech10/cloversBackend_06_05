import LeaveModel from "../models/LeaveModel.js";

// Apply for leave
export const applyLeave = async (req, res) => {
  const { employeeId, fromDate, toDate, leaveType, leaveDuration } = req.body;

  if (!employeeId || !fromDate || !toDate || !leaveType || !leaveDuration) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const leave = new LeaveModel({
      employeeId,
      fromDate,
      toDate,
      leaveType,
      leaveDuration,
    });

    const savedLeave = await leave.save();
    res.status(201).json({ success: true, data: savedLeave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
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
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }

  try {
    const leave = await LeaveModel.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave not found" });
    }

    leave.status = status;
    const updatedLeave = await leave.save();
    res.status(200).json({ success: true, data: updatedLeave });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
