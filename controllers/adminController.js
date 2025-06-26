import AdminModel from "../models/adminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const check = await AdminModel.findOne({ username });
    if (!check) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, check.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: check._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, check: check });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}; 

export const register = async (req, res) => {
    const { username, password } = req.body;
    try {
      const existingUser = await AdminModel.findOne({ username });
      if (existingUser) return res.status(400).json({ error: "User already exists" });
  
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      const newUser = new AdminModel({ username, password: hashedPassword });
      await newUser.save();
  
      res.status(201).json({ error: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  };