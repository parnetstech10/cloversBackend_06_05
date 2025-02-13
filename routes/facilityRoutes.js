import express from "express";
import {
  createFeature,
  getFeatures,
  updateFeature,
  deleteFeature,
} from "../controllers/facilityController.js";

const router = express.Router();

// Create a new feature
router.post("/", createFeature);

// Get all features
router.get("/", getFeatures);

// Update a feature by ID
router.put("/:id", updateFeature);

// Delete a feature by ID
router.delete("/:id", deleteFeature);

export default router;
