import express from "express";
import {
  createDistribution,
  getAllDistributions,
  getDistribution,
  updateDistributionStatus,
  deleteDistribution,
  getDistributionStats,
  getDistributionsByRecipient,
  getAvailableItems,
  checkAdminAccess
} from "../controllers/inventoryDistributionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware first, then admin access check to all routes
router.use(protect);
router.use(checkAdminAccess);

// Distribution CRUD operations
router.post("/", createDistribution);
router.get("/", getAllDistributions);
router.get("/stats", getDistributionStats);
router.get("/available-items", getAvailableItems);
router.get("/recipient/:recipientId", getDistributionsByRecipient);
router.get("/:id", getDistribution);
router.put("/:id/status", updateDistributionStatus);
router.delete("/:id", deleteDistribution);

export default router;
