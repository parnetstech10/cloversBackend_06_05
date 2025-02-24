import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee', // Assuming you have an Employee model
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  punchIn: {
    type: Date,
  },
  punchOut: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave', 'Late'],
    default: 'Present',
  },
//   totalHours: {
//     type: Number,
//     default: 0,
//   },
});

const AttendanceModel = mongoose.model('Attendance', attendanceSchema);

export default AttendanceModel;
