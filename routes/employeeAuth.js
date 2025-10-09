// routes/employeeAuth.js
import express from "express";
import {
  checkEligibility,
  registerEmployee,
  loginEmployee,
  getProfile,
  changePassword,
  authenticateToken
} from "../controllers/employeeAuthController.js";

const router = express.Router();

// Public routes
router.post("/check-eligibility", checkEligibility);
router.post("/register", registerEmployee);
router.post("/login", loginEmployee);

// Protected routes (require authentication)
router.get("/profile", authenticateToken, getProfile);
router.post("/change-password", authenticateToken, changePassword);

export default router;