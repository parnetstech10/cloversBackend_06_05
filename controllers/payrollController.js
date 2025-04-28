// controllers/payrollController.js
import Payroll from '../models/payrollModel.js';
import Employee from '../models/employeeModel.js';

// Get all payroll records
// export const getAllPayrolls = async (req, res) => {
//   try {
//     const payrolls = await Payroll.find().populate('employeeId', 'name employeeId');
//     res.status(200).json({ success: true, data: payrolls });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
// In payrollController.js
export const getAllPayrolls = async (req, res) => {
    try {
      const payrolls = await Payroll.find()
        .populate('employeeId', 'name email phone employeeId')
        .sort({ createdAt: -1 });
        
      // Debug what's coming back
      console.log("Payrolls found:", payrolls.length);
      
      res.status(200).json({ success: true, data: payrolls });
    } catch (error) {
      console.error("Error in getAllPayrolls:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
// Create new payroll record or update if exists
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, attendanceData, taxDeductions, 
            advancePayment, deductionMonths } = req.body;
    
    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    
    // Update employee's basic salary if it's changed
    if (employee.basicSalary !== basicSalary) {
      employee.basicSalary = basicSalary;
    }
    
    // Calculate monthly deduction if advance payment exists
    const monthlyDeduction = advancePayment > 0 ? advancePayment / deductionMonths : 0;
    
    // Include any existing advance from employee record
    let existingAdvanceDeduction = 0;
    if (employee.currentAdvance > 0 && employee.remainingAdvanceMonths > 0) {
      existingAdvanceDeduction = employee.currentAdvance / employee.remainingAdvanceMonths;
    }
    
    // Total deduction this month
    const totalAdvanceDeduction = existingAdvanceDeduction + monthlyDeduction;
    
    // Calculate net salary with total deductions
    const netSalary = basicSalary - taxDeductions - totalAdvanceDeduction;
    
    // Check if a record already exists for this employee in this month/year
    let payroll = await Payroll.findOne({ employeeId, month, year });
    
    if (payroll) {
      // Update existing record
      payroll.basicSalary = basicSalary;
      payroll.attendanceData = attendanceData;
      payroll.taxDeductions = taxDeductions;
      
      // Update advance payment values
      payroll.advancePayment = advancePayment || 0;
      payroll.advanceDeduction = totalAdvanceDeduction;
      payroll.netSalary = netSalary;
      
      await payroll.save();
      
      // Update employee record with advance information
      if (advancePayment > 0) {
        employee.currentAdvance = (employee.currentAdvance - existingAdvanceDeduction) + 
                                (advancePayment - monthlyDeduction);
        employee.remainingAdvanceMonths = deductionMonths - 1;
      } else if (existingAdvanceDeduction > 0) {
        // Just reduce existing advance
        employee.currentAdvance -= existingAdvanceDeduction;
        employee.remainingAdvanceMonths -= 1;
      }
      
      // Update last processed payroll period
      employee.lastPayrollMonth = parseInt(month);
      employee.lastPayrollYear = parseInt(year);
      
      await employee.save();
      
      res.status(200).json({ success: true, data: payroll });
    } else {
      // Create new record
      const newPayroll = await Payroll.create({
        employeeId,
        month,
        year,
        basicSalary,
        attendanceData,
        taxDeductions,
        advancePayment: advancePayment || 0,
        advanceDeduction: totalAdvanceDeduction,
        remainingAdvance: (employee.currentAdvance - existingAdvanceDeduction) + 
                        (advancePayment ? advancePayment - monthlyDeduction : 0),
        deductionMonths: deductionMonths || 1,
        netSalary
      });
      
      // Update employee record
      if (advancePayment > 0) {
        employee.currentAdvance = (employee.currentAdvance - existingAdvanceDeduction) + 
                                (advancePayment - monthlyDeduction);
        employee.remainingAdvanceMonths = deductionMonths - 1;
      } else if (existingAdvanceDeduction > 0) {
        // Just reduce existing advance
        employee.currentAdvance -= existingAdvanceDeduction;
        employee.remainingAdvanceMonths -= 1;
      }
      
      // Update last processed payroll period
      employee.lastPayrollMonth = parseInt(month);
      employee.lastPayrollYear = parseInt(year);
      
      await employee.save();
      
      res.status(201).json({ success: true, data: newPayroll });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process payroll for next month - handle advance deductions
export const processNextMonth = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;
    
    // Find previous month's payroll to check for remaining advance
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    
    const prevPayroll = await Payroll.findOne({ 
      employeeId, 
      month: prevMonth.toString(), 
      year: prevYear 
    });
    
    // If there's remaining advance, apply it to this month
    if (prevPayroll && prevPayroll.remainingAdvance > 0) {
      const remainingMonths = prevPayroll.deductionMonths - 1;
      const monthlyDeduction = remainingMonths > 0 ? 
        prevPayroll.remainingAdvance / remainingMonths : prevPayroll.remainingAdvance;
      
      // Set in response to use in frontend
      res.status(200).json({ 
        success: true, 
        advanceDeduction: monthlyDeduction,
        remainingAdvance: prevPayroll.remainingAdvance - monthlyDeduction,
        remainingMonths: Math.max(0, remainingMonths - 1)
      });
    } else {
      res.status(200).json({ success: true, advanceDeduction: 0, remainingAdvance: 0 });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    const payroll = await Payroll.findByIdAndUpdate(
      id, 
      { paymentStatus }, 
      { new: true }
    );
    
    if (!payroll) {
      return res.status(404).json({ success: false, error: 'Payroll record not found' });
    }
    
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};