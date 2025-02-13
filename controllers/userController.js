import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  const { name, email, password,phone, role, membershipStatus, membershipExpiryDate } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email:email });

    if (userExists) {
      return res.status(400).json({ message: 'User email Id already exists' });
    }
    const checkphone = await User.findOne({ phone:phone });

    if (checkphone) {
      return res.status(400).json({ message: 'User phone number already exists' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      membershipStatus, // Add membership status
      membershipExpiryDate, // Add membership expiry date
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone,
        role: user.role,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message:error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone:user.phone,
          membershipStatus: user.membershipStatus,
          membershipExpiryDate: user.membershipExpiryDate,
        },
      });
    } else {
    return  res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json({
        name: user.name,
        email: user.email,
        phone:user.phone,
        membershipStatus: user.membershipStatus,
        membershipExpiryDate: user.membershipExpiryDate,
        // Include any additional fields you want to send
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


export const getAllusers=async(req,res)=>{
  try {
    let data=await User.find().sort({_id:-1});
    return res.status(200).json({success:data})
  } catch (error) {
    console.log(error);
    
  }
}