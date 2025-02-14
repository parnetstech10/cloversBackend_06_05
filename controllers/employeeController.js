import employeeModel from "../models/employeeModel.js";

const addEmployee = async (req, res) => {
    const { name, email, address, phone, position , employeeId} = req.body;
    try {
        const employee = new employeeModel({
            name,
            email,
            address,
            phone,
            position,
            employeeId
        });
        await employee.save();
        res.status(201).json({ success:"true", message: 'Employee added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message , message:"something went wrong!!!" });
    }
};

const getEmployee = async(req, res) => {
    try {
        const employee = await employeeModel.find({});
        res.status(200).json({ success:"true", employee , message: 'Employee added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message , message:"something went wrong!!!" });
    }
}

const editEmployee = async(req, res) => {
    const { id } = req.params;
    const { name, email, address, phone, position , employeeId } = req.body;
    try {
        const employee = await employeeModel.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        employee.name = name;
        employee.email = email;
        employee.address = address;
        employee.phone = phone;
        employee.position = position;
        employee.employeeId = employeeId;
        await employee.save();
        res.status(200).json({ success:"true", message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message , message:"something went wrong!!!" });
    }
}

const deleteEmployee = async(req, res) => {
    const { id } = req.params;
    try {
        const employee = await employeeModel.findByIdAndDelete(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.status(200).json({ success:"true", message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message , message:"something went wrong!!!" });
    }
}

export {addEmployee , getEmployee ,editEmployee, deleteEmployee};