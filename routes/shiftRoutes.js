import express from "express";
import { createShift, getShifts, autoGenerateSchedule, getAssignments } from "../controllers/shiftController.js";
import { setAvailability, getAvailability } from "../controllers/availabilityController.js";

const router = express.Router();

// shifts
router.post("/shifts", createShift);
router.get("/shifts", getShifts);

// availability
router.post("/availability", setAvailability);
router.get("/availability/:employeeId", getAvailability);

// schedule
router.post("/schedule/auto", autoGenerateSchedule);
router.get("/assignments", getAssignments);

export default router;
