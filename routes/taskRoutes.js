import express from "express";
import {
  getAllTasks,
  getEmployeeTasks,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
} from "../controllers/taskController.js";

const router = express.Router();

// 🧭 ADMIN ROUTES
router.get("/all", getAllTasks);        // GET all tasks
router.post("/", createTask);           // POST create task
router.put("/:id", updateTask);         // PUT update task
router.delete("/:id", deleteTask);      // DELETE task

// 🧭 EMPLOYEE ROUTES
router.get("/:employeeId", getEmployeeTasks);        // GET employee's tasks (supports ?type=today or ?type=completed)
router.post("/:id/complete", completeTask);          // POST mark task complete

export default router;
