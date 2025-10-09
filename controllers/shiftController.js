import Shift from "../models/Shift.js";
import EmployeeAvailability from "../models/EmployeeAvailabilityModel.js";
import ShiftAssignment from "../models/ShiftAssignment.js";
import Employee from "../models/employeeModel.js"; // your existing model

// Create shift
export const createShift = async (req, res) => {
  try {
    const shift = await Shift.create(req.body);
    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all shifts
export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find();
    res.json({ success: true, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Auto-generate schedule for date range
export const autoGenerateSchedule = async (req, res) => {
  try {
    const { startDate, endDate } = req.body; // YYYY-MM-DD
    if (!startDate || !endDate) return res.status(400).json({ success:false, message: "Provide startDate and endDate" });

    const shifts = await Shift.find();
    // load all availabilities (populated)
    const availabilities = await EmployeeAvailability.find().populate('employeeId');

    // convert string to Date
    let date = new Date(startDate);
    const last = new Date(endDate);

    const generated = [];

    while (date <= last) {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      for (const shift of shifts) {
        // For each required role, pick available employees
        for (const reqRole of shift.requiredRoles) {
          const candidates = availabilities.filter(a => {
            if (!a.employeeId) return false;
            // if role stored in availability or employee model use that
            const roleMatches = (a.role && a.role === reqRole.role) || (a.employeeId.position && a.employeeId.position === reqRole.role) || true; // adjust logic per your schema
            if (!roleMatches) return false;

            // not available on that day?
            if (a.availableDays && a.availableDays.length && !a.availableDays.includes(dayName)) return false;

            // check unavailableDates
            const dateKey = date.toISOString().split('T')[0];
            if (a.unavailableDates && a.unavailableDates.includes(dateKey)) return false;

            // passed checks -> candidate
            return true;
          });

          // Basic selection: round-robin / first N
          const take = candidates.slice(0, reqRole.count).map(c => c.employeeId._id);

          // Find or create assignment for this date & shift
          const dateStart = new Date(date.toISOString().split('T')[0] + "T00:00:00.000Z");
          let ass = await ShiftAssignment.findOne({ date: dateStart, shiftId: shift._id });
          if (!ass) {
            ass = new ShiftAssignment({ date: dateStart, shiftId: shift._id, assignedEmployees: take });
          } else {
            // combine (avoid duplicates)
            ass.assignedEmployees = Array.from(new Set([...(ass.assignedEmployees || []), ...take]));
          }
          await ass.save();
          generated.push(ass);
        }
      }

      date.setDate(date.getDate() + 1);
    }

    res.json({ success: true, generated: generated.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success:false, message: err.message });
  }
};

// Get assignments in date range
export const getAssignments = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const q = {};
    if (startDate && endDate) q.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    const assignments = await ShiftAssignment.find(q).populate("shiftId").populate("assignedEmployees", "name email position");
    res.json({ success:true, data: assignments });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};
