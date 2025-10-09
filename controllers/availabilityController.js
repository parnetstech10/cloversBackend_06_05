import EmployeeAvailability from "../models/EmployeeAvailabilityModel.js";

// upsert availability
export const setAvailability = async (req, res) => {
  try {
    const { employeeId, availableDays, unavailableDates, preferredShift, role } = req.body;
    const doc = await EmployeeAvailability.findOneAndUpdate(
      { employeeId },
      { availableDays, unavailableDates, preferredShift, role, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success:true, data: doc });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// get availability per employee
export const getAvailability = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const doc = await EmployeeAvailability.findOne({ employeeId });
    res.json({ success:true, data: doc });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};
