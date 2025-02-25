// import employeeModel from "../models/employeeModel.js";

// const addEmployee = async (req, res) => {
//   const {
//     name,
//     email,
//     address,
//     phone,
//     position,
//     employeeId,
//     panNo,
//     aadharNo,
//     accountNo,
//     ifsc,
//     bank
//   } = req.body;

//   try {
//     const newItem = {
//       name,
//       email,
//       address,
//       phone,
//       position,
//       employeeId,
//       panNo,
//       aadharNo,
//       accountNo,
//       ifsc,
//       bank
//     };
//     if (req.files && req.files.length > 0) {
//       let arr = req.files;
//       for (let i = 0; i < arr.length; i++) {
//         if (arr[i].fieldname === "panPhoto") {
//           newItem["panPhoto"] = arr[i].filename;
//         }
//       }
//     }

//     if (req.files && req.files.length > 0) {
//       let arr = req.files;
//       for (let i = 0; i < arr.length; i++) {
//         if (arr[i].fieldname === "aadharPhoto") {
//           newItem["aadharPhoto"] = arr[i].filename;
//         }
//       }
//     }

//     if (req.files && req.files.length > 0) {
//       let arr = req.files;
//       for (let i = 0; i < arr.length; i++) {
//         if (arr[i].fieldname === "photo") {
//           newItem["photo"] = arr[i].filename;
//         }
//       }
//     }

//     const employee = new employeeModel(newItem);
//     await employee.save();
//     res
//       .status(201)
//       .json({ success: "true", message: "Employee added successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "something went wrong!!!" });
//   }
// };

// const getEmployee = async (req, res) => {
//   try {
//     const employee = await employeeModel.find({});
//     res.status(200).json({
//       success: "true",
//       data:employee,
//       message: "Employee added successfully",
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "something went wrong!!!" });
//   }
// };

// const editEmployee = async (req, res) => {
//     const { id } = req.params;
//     const {
//       name,
//       email,
//       address,
//       phone,
//       position,
//       employeeId,
//       panNo,
//       aadharNo,
//       accountNo,
//       ifsc,
//       bank
//     } = req.body;
  
//     try {
//       const employee = await employeeModel.findById(id);
//       if (!employee) {
//         return res.status(404).json({ error: "Employee not found" });
//       }
  
//       // Update employee fields
//       employee.name = name;
//       employee.email = email;
//       employee.address = address;
//       employee.phone = phone;
//       employee.position = position;
//       employee.employeeId = employeeId;
//       employee.panNo = panNo;
//       employee.aadharNo = aadharNo;
//       employee.accountNo = accountNo;
//       employee.ifsc = ifsc;
//       employee.bank = bank;
  
//       // Handle file uploads
//       if (req.files && req.files.length > 0) {
//         let arr = req.files;
//         for (let i = 0; i < arr.length; i++) {
//           if (arr[i].fieldname === "panPhoto") {
//             employee.panPhoto = arr[i].filename;
//           }
//           if (arr[i].fieldname === "aadharPhoto") {
//             employee.aadharPhoto = arr[i].filename;
//           }
//           if (arr[i].fieldname === "photo") {
//             employee.photo = arr[i].filename;
//           }
//         }
//       }
  
//       await employee.save();
//       res
//         .status(200)
//         .json({ success: "true", message: "Employee updated successfully" });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: error.message, message: "something went wrong!!!" });
//     }
//   };
  

// const deleteEmployee = async (req, res) => {
//   const { id } = req.params;
//   try {
//     const employee = await employeeModel.findByIdAndDelete(id);
//     if (!employee) {
//       return res.status(404).json({ error: "Employee not found" });
//     }
//     res
//       .status(200)
//       .json({ success: "true", message: "Employee deleted successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "something went wrong!!!" });
//   }
// };

// export { addEmployee, getEmployee, editEmployee, deleteEmployee };













import employeeModel from "../models/employeeModel.js";

const addEmployee = async (req, res) => {
  try {
    const { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank } = req.body;

    const newItem = { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname === "panPhoto") newItem.panPhoto = file.filename;
        if (file.fieldname === "aadharPhoto") newItem.aadharPhoto = file.filename;
        if (file.fieldname === "photo") newItem.photo = file.filename;
      });
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
    const { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank } = req.body;

    let updateData = { name, email, address, phone, position, panNo, aadharNo, accountNo, ifsc, bank };

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.fieldname === "panPhoto") updateData.panPhoto = file.filename;
        if (file.fieldname === "aadharPhoto") updateData.aadharPhoto = file.filename;
        if (file.fieldname === "photo") updateData.photo = file.filename;
      });
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

const getEmployeesById = async (req,res) =>{
  const {empId} = req.params;
   try {
     const employee = await employeeModel.findById(empId);
     if(!employee) {
       return res.json({success:false,message:"Employee not found"})
     }
     return res.status(200).json({
        success:true,
        message:"Employee fetched successfully",
        data: employee
     })
   } catch (error) {
    
   }
}

export { addEmployee, getEmployee, editEmployee, deleteEmployee , getEmployeesById };
