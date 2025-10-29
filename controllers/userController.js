import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from "express-validator";
import { uploadFile2 } from '../middleware/aws.js';
import { getNextSequence } from '../models/Counter.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import FCMtoken from '../models/FCMtoken.js';

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
  const next = await getNextSequence('membershipNo');
  return `CCLMSU${String(next).padStart(3, '0')}`;
};
// Generate unique App_No (concurrency-safe)
const generateAppNo = async () => {
  const next = await getNextSequence('appNo');
  return next; // store as number
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
    const {  
      Member_Name, 
      Mobile_Number, 
      email, 
      password, 
      role, 
      membershipStatus, 
      membershipExpiryDate,
      fcmToken,        // Add FCM token
      platform,        // Add platform (android/ios)
      deviceId         // Add device ID
    } = req.body;
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
    
    // Store FCM token if provided
    if (fcmToken && platform) {
      try {
        await FCMtoken.findOneAndUpdate(
          { userId: newMember._id },
          {
            fcmToken: fcmToken,
            deviceId: deviceId || `device_${newMember._id}_${Date.now()}`,
            platform: platform,
            isActive: true,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
        console.log('✅ FCM token stored for new user:', newMember._id);
      } catch (fcmError) {
        console.error('Error storing FCM token:', fcmError);
        // Don't fail registration if FCM token storage fails
      }
    }
    
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
  const { email, password, fcmToken, platform, deviceId } = req.body;

  try {
    const newMember = await User.findOne({ email });

    if (newMember && (await bcrypt.compare(password, newMember.password))) {
    newMember.token=generateToken(newMember._id);

    newMember.id=newMember._id;
    
    // Update FCM token if provided
    if (fcmToken && platform) {
      try {
        await FCMtoken.findOneAndUpdate(
          { userId: newMember._id },
          {
            fcmToken: fcmToken,
            deviceId: deviceId || `device_${newMember._id}_${Date.now()}`,
            platform: platform,
            isActive: true,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
        console.log('✅ FCM token updated for user:', newMember._id);
      } catch (fcmError) {
        console.error('Error updating FCM token:', fcmError);
        // Don't fail login if FCM token update fails
      }
    }
    
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
            updateData["ADHAR"] = await uploadFile2(arr[i],"user");
            
          }
          if (arr[i].fieldname == "PAN") {
            updateData["PAN"] = await uploadFile2(arr[i],"user")
        }
        if (arr[i].fieldname == "Photo") {
          updateData["Photo"] = await uploadFile2(arr[i],"user")
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
          updateProfileImg["profileImage"] = await uploadFile2(arr[i],"user")
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

// Debug/utility: lookup member by Membership_No/App_No/_id
export const findMemberByCode = async (req, res) => {
  try {
    const raw = (req.params.code || '').toString().trim();
    if (!raw) return res.status(400).json({ success: false, message: 'code required' });
    const upper = raw.toUpperCase();
    let user = null;
    // try by id
    try { user = await User.findById(raw); } catch(_) {}
    if (!user) {
      const maybeNum = Number(raw);
      const or = [];
      if (!Number.isNaN(maybeNum)) or.push({ App_No: maybeNum });
      or.push({ Membership_No: upper });
      or.push({ Membership_No: { $regex: `^${upper.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' } });
      or.push({ Membership_No: { $regex: upper.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), $options: 'i' } });
      const m = upper.match(/CCLMSU\s*0*(\d+)/i);
      if (m && m[1]) or.push({ App_No: Number(m[1]) });
      user = await User.findOne({ $or: or });
    }
    if (!user) return res.status(404).json({ success: false, message: 'not found', debug: { raw, upper } });
    return res.status(200).json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// Minimal forgot password handler (stub). Integrate email sending later.
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether the email exists in production
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // Prefer mobile deep link if APP_BASE_URL is empty
    const baseUrl = process.env.APP_BASE_URL && process.env.APP_BASE_URL.trim().length > 0
      ? process.env.APP_BASE_URL
      : 'clovers://';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Configure transporter (use env vars in production)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.MAIL_FROM || 'no-reply@thecloversclub.in',
      to: email,
      subject: 'Reset your Clovers Club password',
      html: `
        <p>Hello ${user.Member_Name || ''},</p>
        <p>You requested to reset your password. Click the link below to set a new password. This link will expire in 15 minutes.</p>
        <p><a href="${resetUrl}" target="_blank">Reset Password</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'Password reset email sent' });
    } catch (mailError) {
      // Dev fallback: allow testing without working SMTP
      if (process.env.EMAIL_DEV_MODE === 'true') {
        console.log('[DEV ONLY] Password reset link:', resetUrl);
        return res.status(200).json({ message: 'Password reset link generated (dev mode)', resetUrl });
      }
      throw mailError;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Failed to process request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Token, email and new password are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email, resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: new Date() } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

export const sendPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // Generate 6-digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes
    user.emailOtpCode = otp;
    user.emailOtpExpires = expiresAt;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.MAIL_FROM || 'no-reply@thecloversclub.in',
      to: email,
      subject: 'Your Clovers Club password reset OTP',
      html: `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      if (process.env.EMAIL_DEV_MODE === 'true') {
        console.log('[DEV ONLY] Password reset OTP:', otp);
      } else {
        throw mailError;
      }
    }

    return res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user || !user.emailOtpCode || !user.emailOtpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    const now = new Date();
    if (user.emailOtpCode !== otp || user.emailOtpExpires <= now) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    return res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body || {};
    if (!email || !otp || !password) return res.status(400).json({ message: 'Email, OTP and password are required' });

    const user = await User.findOne({ email });
    if (!user || user.emailOtpCode !== otp || user.emailOtpExpires <= new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.emailOtpCode = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset with OTP error:', error);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

