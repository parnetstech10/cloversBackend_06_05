import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  position: { type: String, required: true },
  employeeId: { type: String, unique: true },  // Auto-generated
  panNo: { type: String, required: true, unique: true },
  aadharNo: { type: String, required: true, unique: true },
  photo: { type: String, required: true },
  bank: { type: String, required: true },
  accountNo: { type: String, required: true },
  ifsc: { type: String, required: true },
  aadharPhoto: { type: String, required: true },
  panPhoto: { type: String, required: true },
  password: { type: String },
  
  // Payroll integration fields
  basicSalary: { type: Number, default: 0 },
  joiningDate: { type: Date },
  currentAdvance: { type: Number, default: 0 },
  remainingAdvanceMonths: { type: Number, default: 0 },
  lastPayrollMonth: { type: Number }, // Track last processed month
  lastPayrollYear: { type: Number },  // Track last processed year
  
  createdAt: { type: Date, default: Date.now },
});

// Fix employeeId generation
employeeSchema.pre("save", async function (next) {
  if (!this.employeeId) {
    const lastEmployee = await mongoose.model("Employee").findOne().sort({ _id: -1 });
    let newId = "CCLMEMP001"; // Default for first employee

    if (lastEmployee && lastEmployee.employeeId) {
      // Fix pattern match to handle both formats
      const lastIdMatch = lastEmployee.employeeId.match(/^(?:CCLMEMP|EMP)(\d+)$/);
      const lastIdNumber = lastIdMatch ? parseInt(lastIdMatch[1], 10) : 0;

      newId = `CCLMEMP${String(lastIdNumber + 1).padStart(3, "0")}`;
    }

    this.employeeId = newId;
  }
  next();
});

export default mongoose.model("Employee", employeeSchema);