import Employee from "../models/employeeModel.js";
import EmployeeRegistration from "../models/EmployeeRegistration.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Generate JWT token
const generateToken = (registrationId, employeeId) => {
  return jwt.sign({ registrationId, employeeId }, JWT_SECRET, { expiresIn: "30d" });
};

// Check if employee can register
export const checkEligibility = async (req, res) => {
  try {
    const { employeeId, email } = req.body;

    // Check if employee exists in main employee records
    const employee = await Employee.findOne({
      $or: [{ employeeId }, { email }]
    }).select("name email employeeId position");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in our records. Please contact HR."
      });
    }

    // Check if already registered
    const existingRegistration = await EmployeeRegistration.findOne({
      $or: [{ employeeId }, { email }]
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "Employee already registered. Please login instead."
      });
    }

    res.json({
      success: true,
      message: "Employee can register",
      employee: {
        name: employee.name,
        employeeId: employee.employeeId,
        email: employee.email,
        position: employee.position
      }
    });

  } catch (error) {
    console.error("Check eligibility error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking eligibility",
      error: error.message
    });
  }
};

// Employee Registration
export const registerEmployee = async (req, res) => {
  try {
    const { employeeId, email, password } = req.body;

    // Validate input
    if (!employeeId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide employee ID, email, and password"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Verify employee exists in main records
    const employee = await Employee.findOne({
      $or: [{ employeeId }, { email }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found in records. Please contact HR."
      });
    }

    // Check if already registered
    const existingRegistration = await EmployeeRegistration.findOne({
      $or: [{ employeeId }, { email }]
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "Employee already registered. Please login."
      });
    }

    // Create registration record
    const registration = new EmployeeRegistration({
      employeeId: employee.employeeId,
      email: employee.email,
      password
    });

    await registration.save();

    // Generate token
    const token = generateToken(registration._id, employee.employeeId);

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now login.",
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        position: employee.position
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Employee already registered"
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};

// Employee Login
export const loginEmployee = async (req, res) => {
  try {
    const { employeeId, email, password } = req.body;

    if ((!employeeId && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide employee ID/email and password"
      });
    }

    // Build query based on what's provided
    let query = { isActive: true };
    
    if (employeeId && email) {
      // If both provided, check either one
      query.$or = [{ employeeId }, { email }];
    } else if (employeeId) {
      // If only employeeId provided
      query.employeeId = employeeId;
    } else if (email) {
      // If only email provided
      query.email = email;
    }

    // Find registration record
    const registration = await EmployeeRegistration.findOne(query);

    if (!registration) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or account not registered"
      });
    }

    // Check if account is locked
    if (registration.isLocked()) {
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked due to too many failed attempts. Try again later."
      });
    }

    // Verify password
    const isPasswordValid = await registration.comparePassword(password);
    
    if (!isPasswordValid) {
      // Increment failed attempts
      await registration.incrementLoginAttempts();
      
      const attemptsLeft = 5 - (registration.loginAttempts + 1);
      
      return res.status(401).json({
        success: false,
        message: `Invalid credentials${attemptsLeft > 0 ? ` (${attemptsLeft} attempts remaining)` : ''}`
      });
    }

    // Reset login attempts on successful login
    await EmployeeRegistration.findByIdAndUpdate(registration._id, {
      $set: { loginAttempts: 0, lastLogin: new Date() },
      $unset: { lockUntil: 1 }
    });

    // Get employee details
    const employee = await Employee.findOne({ 
      employeeId: registration.employeeId 
    }).select("name email employeeId position");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee record not found"
      });
    }

    // Generate token
    const token = generateToken(registration._id, employee.employeeId);

    res.json({
      success: true,
      message: "Login successful",
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        position: employee.position
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};


// Updated getProfile in controllers/employeeAuthController.js
export const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ 
      employeeId: req.employeeId 
    }).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      employee
    });

  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message
    });
  }
};


// Updated changePassword in controllers/employeeAuthController.js
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.registration.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Update password
    req.registration.password = newPassword;
    await req.registration.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

// Middleware to protect routes
export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify registration exists
    const registration = await EmployeeRegistration.findById(decoded.registrationId);
    if (!registration) {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Add registration and employeeId to request
    req.registration = registration;
    req.employeeId = decoded.employeeId;
    next();

  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};