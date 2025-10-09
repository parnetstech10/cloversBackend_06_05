import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee", // Make sure you have an Employee model
    required: true,
  },
  category: {
    type: String,
    enum: ["restaurant", "bar", "housekeeping", "frontdesk", "maintenance", "general"],
    default: "general",
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium",
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  time: {
    type: String, // storing time as string like "14:30"
    default: "",
  },
}, { timestamps: true });

export default mongoose.model("Task", taskSchema);
