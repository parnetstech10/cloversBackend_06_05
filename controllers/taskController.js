import Task from "../models/Task.js";

// ✅ Admin - Get all tasks
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("employeeId", "name email position");
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Employee - Get tasks assigned to an employee (with optional filter)
export const getEmployeeTasks = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type } = req.query;

    let query = { employeeId };

    // Filter logic based on "type"
    if (type === "completed") {
      query.status = "completed";
    } else if (type === "today") {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const tasks = await Task.find(query).populate("employeeId", "name email position");

    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Admin - Create new task
export const createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Admin - Update task
export const updateTask = async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Admin - Delete task
export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Employee - Mark task as completed
export const completeTask = async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
