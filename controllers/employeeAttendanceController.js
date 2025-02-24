// import express from "express";
// import AttendanceModel from "../models/employeeAttendance.js";

// const attendanceRouter = express.Router();

// // Punch In
// attendanceRouter.post("/punch-in", async (req, res) => {
//   const { employeeId } = req.body;
//   try {
//     const attendance = await AttendanceModel.findById(employeeId);

//      attendance = new AttendanceModel({
//       employeeId,
//       punchIn: new Date(),
//     });
//     const newAttendance = await attendance.save();
//     res.status(201).json(newAttendance);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Punch Out
// attendanceRouter.post("/punch-out/:id", async (req, res) => {
//     const {id} = req.params
//   try {
//     const attendance = await AttendanceModel.findById(id);
//     if (attendance) {
//       attendance.punchOut = new Date();
//       attendance.totalHours =
//         (attendance.punchOut - attendance.punchIn) / 1000 / 3600; // Calculate total hours in seconds
//       const updatedAttendance = await attendance.save();
//       res.status(200).json(updatedAttendance);
//     } else {
//       res.status(404).json({ message: "Attendance not found" });
//     }
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Fetch all attendance records
// attendanceRouter.get("/", async (req, res) => {
//   try {
//     const attendance = await Attendance.find().populate("employeeId");
//     res.status(200).json(attendance);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// export default attendanceRouter;

// import express from "express";
// import AttendanceModel from "../models/employeeAttendance.js";
// import employeeModel from "../models/employeeModel.js";

// const attendanceRouter = express.Router();

// // Punch In
// attendanceRouter.post("/punch-in", async (req, res) => {
//   const { employeeId } = req.body;
//   try {
//     const existingAttendance = await AttendanceModel.findOne({ employeeId, date: new Date().toISOString().slice(0, 10) });

//     if (existingAttendance) {
//       return res.status(400).json({ message: "Already punched in for today" });
//     }

//     const attendance = new AttendanceModel({
//       employeeId,
//       punchIn: new Date()
//     });
//     const newAttendance = await attendance.save();
//     res.status(201).json(newAttendance);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Punch Out
// attendanceRouter.post("/punch-out", async (req, res) => {
//   const { employeeId } = req.body;
//   try {
//     const attendance = await AttendanceModel.findById(employeeId);
//     if (attendance) {
//       attendance.punchOut = new Date();

//       const punchInDate = new Date(`1970-01-01T${attendance.punchIn}:00`);
//       const punchOutDate = new Date(`1970-01-01T${attendance.punchOut}:00`);
//       const totalHours = (punchOutDate - punchInDate) / 1000 / 3600; // Calculate total hours

//       attendance.totalHours = totalHours;
//       const updatedAttendance = await attendance.save();
//       res.status(200).json(updatedAttendance);
//     } else {
//       res.status(404).json({ message: "Attendance not found" });
//     }
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// // Fetch all attendance records
// attendanceRouter.get("/", async (req, res) => {
//   try {
//     const attendance = await AttendanceModel.find().populate("employeeId");
//     res.status(200).json(attendance);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// export default attendanceRouter;

import express from "express";
import AttendanceModel from "../models/employeeAttendance.js";

const attendanceRouter = express.Router();

// Punch In
attendanceRouter.post("/punch-in", async (req, res) => {
  const { employeeId } = req.body;
  try {
    const existingAttendance = await AttendanceModel.findOne({
      employeeId,
      date: new Date().toISOString().slice(0, 10),
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Already punched in for today" });
    }

    const attendance = new AttendanceModel({
      employeeId,
      punchIn: new Date(),
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
    const existingAttendance = await AttendanceModel.findOne({
      employeeId,
      date: new Date().toISOString().slice(0, 10),
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Already punched in for today" });
    }
    const attendance = new AttendanceModel({
      employeeId,
      punchOut: new Date(),
    });
    const newAttendance = await attendance.save();
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fetch all attendance records
attendanceRouter.get("/", async (req, res) => {
  try {
    const attendance = await AttendanceModel.find().populate("employeeId");
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default attendanceRouter;
