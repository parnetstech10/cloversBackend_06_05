import express from "express";
import AttendanceModel from "../models/employeeAttendance.js";

const attendanceRouter = express.Router();

// Punch In
attendanceRouter.post("/punch-in", async (req, res) => {
  const { employeeId } = req.body;
  try {
    // Normalize date to YYYY-MM-DD to store as day identifier
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await AttendanceModel.findOne({
      employeeId,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Already punched in for today" });
    }

    const attendance = new AttendanceModel({
      employeeId,
      date: today,
      punchIn: new Date()
    });

    const newAttendance = await attendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Punch Out
attendanceRouter.post("/punch-out", async (req, res) => {
  const { employeeId } = req.body;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await AttendanceModel.findOne({
      employeeId,
      date: today
    });

    if (!existingAttendance) {
      return res.status(400).json({ message: "You have not checked in today" });
    }

    if (existingAttendance.punchOut) {
      return res.status(400).json({ message: "Already punched out for today" });
    }

    existingAttendance.punchOut = new Date();

    // Optional: calculate total hours worked
    existingAttendance.totalHours = 
      (existingAttendance.punchOut - existingAttendance.punchIn) / 1000 / 3600;

    const updatedAttendance = await existingAttendance.save();
    res.status(200).json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fetch attendance status for today
attendanceRouter.get("/status/:employeeId", async (req, res) => {
  const { employeeId } = req.params;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await AttendanceModel.findOne({
      employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(200).json({});
    }

    res.status(200).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

attendanceRouter.get("/", async (req, res) => {
  try {
    // Populate employee details (id, email, name, etc.)
    const attendance = await AttendanceModel.find().populate("employeeId", "employeeId name email");
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch attendance history for a single employee
attendanceRouter.get("/history/:employeeId", async (req, res) => {
  const { employeeId } = req.params;
  try {
    // Get all attendance records for this employee, sorted by date descending
    const records = await AttendanceModel.find({ employeeId }).sort({ date: -1 });
    
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


attendanceRouter.get("/calendar/:employeeId/:year/:month", async (req, res) => {
  const { employeeId, year, month } = req.params;

  try {
    // Timezone offset for IST (+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;

    // Define IST month boundaries
    const startDateIST = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDateIST = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Convert to UTC for MongoDB query
    const startDate = new Date(startDateIST.getTime() - istOffsetMs);
    const endDate = new Date(endDateIST.getTime() - istOffsetMs);

    // Fetch attendance records for that month
    const records = await AttendanceModel.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
    });

    const marked = {};

    // Step 1: Add attendance records (convert to IST)
    records.forEach((record) => {
      let dotColor;
      if (record.status === "Present") dotColor = "#c5a48a";
      else if (record.status === "Absent") dotColor = "#FF0000";
      else if (record.status === "Holiday") dotColor = "#FFB6C1";

      const recordDate = new Date(record.date);
      const indianDate = new Date(recordDate.getTime() + istOffsetMs);
      const dateKey = indianDate.toISOString().split("T")[0]; // YYYY-MM-DD

      marked[dateKey] = { marked: true, dotColor, status: record.status };
    });

    // Step 2: Add all Sundays as Holiday (if not already marked)
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const dateObj = new Date(year, month - 1, day);

      // Sunday = 0
      if (dateObj.getDay() === 0 && !marked[dateKey]) {
        marked[dateKey] = {
          marked: true,
          dotColor: "#FFB6C1",
          status: "Holiday",
        };
      }
    }

    res.status(200).json(marked);
  } catch (error) {
    console.error("Error fetching attendance calendar:", error);
    res.status(500).json({ message: error.message });
  }
});




export default attendanceRouter;
