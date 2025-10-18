import express from "express";
import {
  createLeaveRequest,
  getAllLeaveRequests,
  getLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getEmployeeLeaveBalance,
  getDepartmentLeaveStats,
  getPendingApprovals,
  getEmployeeLeaveHistory,
  updateLeaveRequest,
  deleteLeaveRequest,
  getLeaveStatistics
} from "../controllers/leaveManagementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Leave request CRUD operations
router.post("/", createLeaveRequest);
router.get("/", getAllLeaveRequests);
router.get("/stats", getLeaveStatistics);
router.get("/pending", getPendingApprovals);
router.get("/employee/:employeeId/balance", getEmployeeLeaveBalance);
router.get("/employee/:employeeId/history", getEmployeeLeaveHistory);
router.get("/department/:department/stats", getDepartmentLeaveStats);
router.get("/:id", getLeaveRequest);
router.put("/:id", updateLeaveRequest);
router.put("/:id/approve", approveLeaveRequest);
router.put("/:id/reject", rejectLeaveRequest);
router.put("/:id/cancel", cancelLeaveRequest);
router.delete("/:id", deleteLeaveRequest);

export default router;

