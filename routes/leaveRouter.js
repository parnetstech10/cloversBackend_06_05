import express from "express";
import { applyLeave, getAllLeaves, getEmployeeLeaves, updateLeaveStatus } from "../controllers/leaveController.js";

const leaveRouter = express.Router();

// Apply for leave
leaveRouter.post("/apply", applyLeave);

// Get all leave applications
leaveRouter.get("/", getAllLeaves);

// Get leaves for a single employee
leaveRouter.get("/employee/:employeeId", getEmployeeLeaves);

// Update leave status (approve/reject)
leaveRouter.put("/status/:leaveId", updateLeaveStatus);

export default leaveRouter;
