import { uploadFile2 } from "../middleware/aws.js";
import employeeModel from "../models/employeeModel.js";

const addEmployee = async (req, res) => {
  try {
    const { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank , password} = req.body;
     
    const newItem = { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank , password };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname === "panPhoto") {
          newItem.panPhoto = await uploadFile2(file, "employee");
        }
        if (file.fieldname === "aadharPhoto") {
          newItem.aadharPhoto = await uploadFile2(file, "employee");
        }
        if (file.fieldname === "photo") {
          newItem.photo = await uploadFile2(file, "employee");
        }
      }
    }
    // Duplicate checks for user-friendly errors
    if (phone) {
      const existPhone = await employeeModel.findOne({ phone });
      if (existPhone) {
        return res.status(400).json({ success: false, message: "Phone number already exists. Please use a different number." });
      }
    }
    if (email) {
      const existEmail = await employeeModel.findOne({ email });
      if (existEmail) {
        return res.status(400).json({ success: false, message: "Email already exists. Please use a different email." });
      }
    }
    if (panNo) {
      const existPan = await employeeModel.findOne({ panNo });
      if (existPan) {
        return res.status(400).json({ success: false, message: "PAN number already exists. Please verify and try again." });
      }
    }
    if (aadharNo) {
      const existAadhar = await employeeModel.findOne({ aadharNo });
      if (existAadhar) {
        return res.status(400).json({ success: false, message: "Aadhar number already exists. Please verify and try again." });
      }
    }

    const employee = new employeeModel(newItem);
    await employee.save();
    
    res.status(201).json({ success: true, message: "Employee added successfully", data: employee });
  } catch (error) {
 console.error("ADD EMPLOYEE ERROR:", error);
  // Map duplicate key errors to clear messages
  if (error && error.code === 11000) {
    const key = error.keyPattern ? Object.keys(error.keyPattern)[0] : undefined;
    const fieldMessages = {
      phone: "Phone number already exists. Please use a different number.",
      email: "Email already exists. Please use a different email.",
      panNo: "PAN number already exists. Please verify and try again.",
      aadharNo: "Aadhar number already exists. Please verify and try again.",
      employeeId: "Employee ID already exists.",
    };
    const message = (key && fieldMessages[key]) || "Duplicate value exists. Please use a different value.";
    return res.status(400).json({ success: false, message });
  }

  res.status(500).json({
    success: false,
    error: error.message,
    message: "Something went wrong!",
  });  }
};

const getEmployee = async (req, res) => {
  try {
    const employees = await employeeModel.find({});
    res.status(200).json({ success: true, data: employees, message: "Employees retrieved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: "Something went wrong!" });
  }
};

const editEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank , password } = req.body;

    let updateData = { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank , password };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname === "panPhoto") {
          newItem.panPhoto = await uploadFile2(file, "employee");
        }
        if (file.fieldname === "aadharPhoto") {
          newItem.aadharPhoto = await uploadFile2(file, "employee");
        }
        if (file.fieldname === "photo") {
          newItem.photo = await uploadFile2(file, "employee");
        }
      }
    }
    

    const updatedEmployee = await employeeModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee updated successfully", data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: "Something went wrong!" });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeModel.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: "Something went wrong!" });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await employeeModel.findById(id);
    
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export { addEmployee, getEmployee, editEmployee, deleteEmployee, getEmployeeById };
