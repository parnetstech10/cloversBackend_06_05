import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from "express-validator";

const validateMember = [
  // check("Membership_No").notEmpty().withMessage("Membership number is required"),
  check("Member_Name").notEmpty().withMessage("Member name is required"),
  check("Mobile_Number").isNumeric().withMessage("Mobile number must be numeric"),
  check("email").isEmail().withMessage("Valid email is required"),
];

// const generateMembershipNo = async () => {
//   const lastMember = await User.findOne().sort({ _id: -1 });
//   const lastNumber = lastMember ? parseInt(lastMember.Membership_No?.slice(5)) : 0;
//   return `CCLMSU${String(lastNumber + 1).padStart(3, "0")}`;
// };
const generateMembershipNo = async () => {
  try {
    const lastMember = await User.findOne().sort({ _id: -1 });
    
    // Default to 0 if no members exist
    if (!lastMember || !lastMember.Membership_No) {
      return "CCLMSU001";
    }
    
    // Extract the numeric part (after the 6-character prefix)
    const numericPart = lastMember.Membership_No.slice(6);
    const lastNumber = parseInt(numericPart);
    
    // Ensure we have a valid number
    if (isNaN(lastNumber)) {
      console.error("Invalid membership number format:", lastMember.Membership_No);
      return "CCLMSU001"; // Fallback to first number if parsing fails
    }
    
    return `CCLMSU${String(lastNumber + 1).padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating membership number:", error);
    return "CCLMSU001"; // Fallback in case of any error
  }
};
// Generate unique App_No
const generateAppNo = async () => {
  const lastMember = await User.findOne().sort({ _id: -1 });
  const lastAppNo = lastMember ? parseInt(lastMember.App_No) : 0;
  return String(lastAppNo + 1).padStart(3, "0");
};

export const registerUser = async (req, res) => {
  for (let validation of validateMember) {
    await validation.run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }
  }


  try {
    const {  Member_Name, Mobile_Number, email, password, role, membershipStatus, membershipExpiryDate } = req.body;
    console.log("reqbody",req.body);
    
    const Membership_No = await generateMembershipNo();
    const App_No = await generateAppNo();

    // Check if email or phone exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User email already exists" });
    }
    const phoneExists = await User.findOne({ Mobile_Number });
    if (phoneExists) {
      return res.status(400).json({ message: "User phone number already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create member
    const newMember = new User({
      Membership_No,
      Member_Name,
      Mobile_Number,
      email,
      password: hashedPassword,
      role,
      App_No
    });
  // console.log("newMember",newMember);
  
    await newMember.save();
    res.status(201).json({
      id: newMember._id,
     ...newMember,
      token: generateToken(newMember._id),
    });
  } catch (error) {
    console.log(error.message);
    
    res.status(400).json({ error: error.message });
  } 
};


export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const newMember = await User.findOne({ email });

    if (newMember && (await bcrypt.compare(password, newMember.password))) {
    newMember.token=generateToken(newMember._id);

    newMember.id=newMember._id;
    
      res.json({
        token: generateToken(newMember._id),
        user:newMember,
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
      res.json(user);
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

export const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
 console.log(req.body);
 
    if (req.files.length != 0) {
      let arr = req.files
      for (let i = 0; i < arr.length; i++) {
          if (arr[i].fieldname == "ADHAR") {
            updateData["ADHAR"] = arr[i].filename;
            
          }
          if (arr[i].fieldname == "PAN") {
            updateData["PAN"] = arr[i].filename
        }
        if (arr[i].fieldname == "Photo") {
          updateData["Photo"] = arr[i].filename
       }
          }}

          updateData["isDoc"]=true;
    const updatedMember = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json({msg:"Successfully uploaded",data:updatedMember});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// <<<<<<< HEAD
export const updateMemberImg = async (req, res) => {
  try {
    const { id } = req.params;
    const updateProfileImg = req.body;
 
    if (req.files.length != 0) {
      let arr = req.files
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].fieldname == "profileImage") {
          updateProfileImg["profileImage"] = arr[i].filename
       }
          }}

          updateProfileImg["isDoc"]=true;
          console.log(req.body, req.params,updateProfileImg);
          
    const updatedMember = await User.findByIdAndUpdate(id, updateProfileImg, { new: true });
    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json({msg:"Successfully uploaded",data:updatedMember});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMemberImg = async (req, res) => {
  try {
    const { id } = req.params;

    const member = await User.findById(id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

