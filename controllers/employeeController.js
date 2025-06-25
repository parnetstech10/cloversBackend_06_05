import { uploadFile2 } from "../middleware/aws.js";
import employeeModel from "../models/employeeModel.js";

const addEmployee = async (req, res) => {
  try {
    const { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank , password} = req.body;
    console.log(req.body,"wet")
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
    const employee = new employeeModel(newItem);
    await employee.save();
    
    res.status(201).json({ success: true, message: "Employee added successfully", data: employee });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, message: "Something went wrong!" });
  }
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
