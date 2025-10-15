import AdminModel from "../models/adminModel.js";
import SubAdminModel from "../models/subAdmin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const login = async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body || {};
    const idValue = (identifier || email || username || "").trim();
    if (!idValue || !password) {
      return res.status(400).json({ error: "Email/Username and password are required" });
    }

    // Try Admin by username or email
    let user = await AdminModel.findOne({ $or: [{ username: idValue }, { email: idValue }] });

    // Then SubAdmin by email or username
    if (!user) {
      user = await SubAdminModel.findOne({ $or: [{ email: idValue }, { username: idValue }] });
    }

    if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const safeUser = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };
    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Server error" });
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

  export const addSubAdmin = async (req, res) => {
  const { name, email, role, password, permissions, username } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const sub = new SubAdmin({
    name,
    email,
    role,
    username: username || undefined,
    password: hashed,
    permissions: Array.isArray(permissions) ? permissions : [],
  });
  await sub.save();
  return res.status(201).json({ message: 'Sub admin created' });
};