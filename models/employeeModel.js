// import mongoose from "mongoose";

// const employeeSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   address: { type: String, required: true },
//   phone: { type: String, required: true, unique: true },
//   position: { type: String, required: true },
//   employeeId: { type: String, required: true, unique: true },
//   panNo:{type:String, required:true, unique:true},
//   aadharNo: { type: String, required: true, unique: true },
//   photo:{type:String,required:true},
//   bank:{type:String,required:true},
//   accountNo:{type:String,required:true},
//   ifsc:{type:String,required:true},
//   aadharPhoto:{type:String,required:true},
//   panPhoto:{type:String,required:true},
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("Employee", employeeSchema);









import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  position: { type: String, required: true },
  employeeId: { type: String, unique: true },  // Remove required to auto-generate
  panNo: { type: String, required: true, unique: true },
  aadharNo: { type: String, required: true, unique: true },
  photo: { type: String, required: true },
  bank: { type: String, required: true },
  accountNo: { type: String, required: true },
  ifsc: { type: String, required: true },
  aadharPhoto: { type: String, required: true },
  panPhoto: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Middleware to auto-generate employeeId
employeeSchema.pre("save", async function (next) {
  if (!this.employeeId) {
    const lastEmployee = await mongoose.model("Employee").findOne().sort({ _id: -1 });
    let newId = "EMP001"; // Default for first employee

    if (lastEmployee && lastEmployee.employeeId) {
      const lastIdMatch = lastEmployee.employeeId.match(/^EMP(\d+)$/); // Match and extract number
      const lastIdNumber = lastIdMatch ? parseInt(lastIdMatch[1], 10) : 0; // Extract number or default to 0

      newId = `EMP${String(lastIdNumber + 1).padStart(3, "0")}`; // Increment and format
    }

    this.employeeId = newId;
  }
  next();
});


export default mongoose.model("Employee", employeeSchema);
