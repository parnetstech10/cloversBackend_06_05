import mongoose from "mongoose";
import bcrypt from "bcryptjs";
// import { required } from "joi";

const employeeRegistrationSchema =new mongoose.Schema({
    employeeId:{
        type:String,
        required:true,
        unique:true,
        ref:"Employee"
    },
     email: { 
    type: String, 
    required: true, 
    unique: true 
  },
   password: { 
    type: String, 
    required: true 
  },
    registrationDate: { 
    type: Date, 
    default: Date.now 
  },
    lastLogin: { 
    type: Date 
  },
    isActive: { 
    type: Boolean, 
    default: true 
  },
    loginAttempts: {
    type: Number,
    default: 0
  }, 
  lockUntil: {
    type: Date
  }
},
{
    timestamps:true
});

// Hash password before saving
employeeRegistrationSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    try {
        const salt=await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password, salt);
        next()
    } catch (error) {
          next(error);
    }
})

// Compare password method
employeeRegistrationSchema.methods.comparePassword=async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password)
}

// Check if account is locked
employeeRegistrationSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
employeeRegistrationSchema.methods.incrementLoginAttempts = async function () {
  // If previous lock has expired, restart attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock the account if reached max attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

export default mongoose.model("EmployeeRegistration", employeeRegistrationSchema);