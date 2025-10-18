import express from "express";
import { 
  applyLeave, 
  getAllLeaves, 
  getEmployeeLeaves, 
  updateLeaveStatus,
  getPendingApprovals,
  getLeaveStatistics,
  getEmployeeLeaveBalance,
  cancelLeaveRequest,
  getLeavesForPayroll,
  markLeaveProcessed
} from "../controllers/leaveController.js";
import { protect } from "../middleware/authMiddleware.js";

const leaveRouter = express.Router();

// Apply auth middleware to all routes
leaveRouter.use(protect);

// Apply for leave
leaveRouter.post("/apply", applyLeave);

// Get all leave applications
leaveRouter.get("/", getAllLeaves);

// Get leave statistics
leaveRouter.get("/stats", getLeaveStatistics);

// Get pending approvals
leaveRouter.get("/pending", getPendingApprovals);

// Get leaves for payroll processing
leaveRouter.get("/payroll", getLeavesForPayroll);

// Get leaves for a single employee
leaveRouter.get("/employee/:employeeId", getEmployeeLeaves);

// Get employee leave balance
leaveRouter.get("/employee/:employeeId/balance", getEmployeeLeaveBalance);

// Update leave status (approve/reject)
leaveRouter.put("/status/:leaveId", updateLeaveStatus);

// Cancel leave request
leaveRouter.put("/cancel/:leaveId", cancelLeaveRequest);

// Mark leave as processed in payroll
leaveRouter.put("/payroll/:leaveId", markLeaveProcessed);

export default leaveRouter;
