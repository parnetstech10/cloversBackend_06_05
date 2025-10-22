import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AdminModel from '../models/adminModel.js';
import SubAdminModel from '../models/subAdmin.js';
import Employee from '../models/employeeModel.js';

export const protect = async (req, res, next) => {
  let token;

  console.log("Auth middleware - Authorization header:", req.headers.authorization);
  console.log("Auth middleware - All headers:", Object.keys(req.headers));
  console.log("Auth middleware - Headers with 'auth':", Object.keys(req.headers).filter(key => key.toLowerCase().includes('auth')));

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log("Auth middleware - Token extracted:", token ? "Token exists" : "No token");

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Auth middleware - Token decoded:", decoded);

      // Get user from token and attach to request object
      // Try to find user in different models
      console.log("Auth middleware - Searching for user ID:", decoded.id);
      
      let user = await User.findById(decoded.id).select('-password');
      console.log("Auth middleware - User model result:", user ? "Found" : "Not found");
      
      if (!user) {
        user = await AdminModel.findById(decoded.id).select('-password');
        console.log("Auth middleware - AdminModel result:", user ? "Found" : "Not found");
      }
      if (!user) {
        user = await SubAdminModel.findById(decoded.id).select('-password');
        console.log("Auth middleware - SubAdminModel result:", user ? "Found" : "Not found");
      }
      if (!user) {
        user = await Employee.findById(decoded.id).select('-password');
        console.log("Auth middleware - Employee model result:", user ? "Found" : "Not found");
      }
      
      req.user = user;
      console.log("Auth middleware - User found:", req.user ? `User: ${req.user.Member_Name || req.user.username || req.user.name}, Role: ${req.user.role}` : "No user found");

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log("Auth middleware - No token provided");
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
