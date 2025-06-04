import Guest from '../models/guest.js';
import User from '../models/User.js';

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// OTP expiration time (5 minutes)
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 300,000 ms

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Normalize phone number - removes all non-digits and ensures consistent format
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  return String(phoneNumber).replace(/\D/g, ''); // Remove all non-digit characters
};

// Placeholder for sending OTP via SMS (replace with actual SMS service)
const sendOTP = async (mobileNumber, otp) => {
  try {
    console.log(`Sending OTP ${otp} to ${mobileNumber}`);
    // Example Twilio code (uncomment and configure with your credentials):
    /*
    const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: `Your OTP for guest registration is ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: mobileNumber
    });
    */
    return true; // Return true for successful sending
  } catch (error) {
    console.error(`Failed to send OTP to ${mobileNumber}:`, error);
    return false;
  }
};

// Create a new guest (initiates OTP process)
export const createGuest = async (req, res) => {
  try {
    const guestData = req.body;
    guestData.role = "Guest";

    // Required Fields Check
    if (!guestData.Membership_No || !guestData.Member_Name || !guestData.Guest_Mo_No) {
      return res.status(400).json({
        success: false,
        message: "Membership_No, Member_Name, and Guest_Mo_No are required",
      });
    }

    // Normalize mobile numbers consistently
    guestData.Guest_Mo_No = normalizePhoneNumber(guestData.Guest_Mo_No);

    // Handle file uploads
    if (req.files?.length) {
      req.files.forEach((file) => {
        if (file.fieldname === "ADHAR") guestData.ADHAR = file.filename;
        if (file.fieldname === "PAN") guestData.PAN = file.filename;
        if (file.fieldname === "Photo") guestData.Photo = file.filename;
      });
      guestData.isDoc = true;
    }

    // Find the sponsoring member
    const member = await User.findOne({ Membership_No: guestData.Membership_No });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "No member found with this Membership Number",
      });
    }

    // Ensure the user has the correct role
    if (!["Member", "Admin"].includes(member.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Members or Admins can sponsor guests",
      });
    }

    // Assign sponsor info with normalized mobile number
    const memberMobileNumber = normalizePhoneNumber(member.Mobile_Number);
    guestData.Mobile_Number = memberMobileNumber;
    guestData.sponsoredBy = member._id;

    // Check for duplicate Guest_Mo_No
    const duplicateConditions = [];

    if (guestData.Guest_Mo_No) {
      duplicateConditions.push({ Guest_Mo_No: guestData.Guest_Mo_No });
    }
    if (guestData.Aadhar_No) {
      duplicateConditions.push({ Aadhar_No: guestData.Aadhar_No });
    }
    if (guestData.Pan) {
      duplicateConditions.push({ Pan: guestData.Pan });
    }
    if (guestData.email) {
      duplicateConditions.push({ email: guestData.email });
    }
    
    if (duplicateConditions.length > 0) {
      const existingGuest = await Guest.findOne({ $or: duplicateConditions });
      if (existingGuest) {
        return res.status(400).json({
          success: false,
          message: "A guest already exists with the same mobile number, Aadhaar, PAN, or email.",
        });
      }
    }
    

    // Generate OTP
    const otp = generateOTP();
    const otpData = {
      otp,
      guestData,
      memberMobileNumber, // Store the member's mobile number for reference
      createdAt: Date.now(),
    };

    // Create a unique key for the OTP store
    // Using membership number + member mobile as key to avoid conflicts
    const otpKey = `${guestData.Membership_No}_${memberMobileNumber}`;

    // Store OTP and guest data
    otpStore.set(otpKey, otpData);
    console.log(`Stored OTP with key ${otpKey}:`, otpData); // Debug log

    // Send OTP to member's mobile number
    const otpSent = await sendOTP(memberMobileNumber, otp);

    if (!otpSent) {
      otpStore.delete(otpKey); // Clean up on failure
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent to member's mobile number. Please verify to complete registration.",
      membershipNumber: guestData.Membership_No,
      memberMobileNumber: memberMobileNumber,
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });
  } catch (error) {
    console.error("Error initiating guest registration:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate entry for field: ${field}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while initiating guest registration",
      error: error.message,
    });
  }
};

// Verify OTP and complete guest registration
export const verifyOTPAndRegister = async (req, res) => {
  try {
    let { membershipNumber, mobileNumber, otp } = req.body;

    // Updated validation - we need either membershipNumber or mobileNumber to create the key
    if ((!membershipNumber && !mobileNumber) || !otp) {
      return res.status(400).json({
        success: false,
        message: "Membership number (or mobile number) and OTP are required",
      });
    }

    // Normalize inputs
    otp = String(otp).trim();
    
    let otpKey;
    if (membershipNumber && mobileNumber) {
      // If both are provided, use the combined key
      mobileNumber = normalizePhoneNumber(mobileNumber);
      otpKey = `${membershipNumber}_${mobileNumber}`;
    } else if (membershipNumber) {
      // If only membership number is provided, find the member's mobile number
      const member = await User.findOne({ Membership_No: membershipNumber });
      if (!member) {
        return res.status(404).json({
          success: false,
          message: "No member found with this Membership Number",
        });
      }
      mobileNumber = normalizePhoneNumber(member.Mobile_Number);
      otpKey = `${membershipNumber}_${mobileNumber}`;
    } else {
      // If only mobile number is provided, search through stored OTPs
      mobileNumber = normalizePhoneNumber(mobileNumber);
      // Find the key that ends with this mobile number
      for (const [key, data] of otpStore.entries()) {
        if (key.endsWith(`_${mobileNumber}`)) {
          otpKey = key;
          break;
        }
      }
      if (!otpKey) {
        return res.status(400).json({
          success: false,
          message: "No OTP found for this mobile number or OTP has expired",
        });
      }
    }

    // Retrieve OTP data
    const otpData = otpStore.get(otpKey);
    console.log(`Retrieved OTP data with key ${otpKey}:`, otpData); // Debug log

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this request or OTP has expired",
      });
    }

    // Check if OTP is expired
    const timeElapsed = Date.now() - otpData.createdAt;
    console.log(`Time elapsed for OTP: ${timeElapsed}ms`); // Debug log
    if (timeElapsed > OTP_EXPIRY_TIME) {
      otpStore.delete(otpKey);
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP is valid, proceed with guest registration
    const guestData = otpData.guestData;
    const newGuest = new Guest(guestData);
    const savedGuest = await newGuest.save();

    // Clear OTP from store
    otpStore.delete(otpKey);
    console.log(`Cleared OTP with key ${otpKey}`); // Debug log

    res.status(201).json({
      success: true,
      message: "Guest registered successfully",
      data: savedGuest,
    });
  } catch (error) {
    console.error("Error verifying OTP and registering guest:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate entry for field: ${field}`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while verifying OTP and registering guest",
      error: error.message,
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    let { membershipNumber, mobileNumber } = req.body;

    if (!membershipNumber && !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Membership number or mobile number is required",
      });
    }

    let otpKey;
    if (membershipNumber && mobileNumber) {
      mobileNumber = normalizePhoneNumber(mobileNumber);
      otpKey = `${membershipNumber}_${mobileNumber}`;
    } else if (membershipNumber) {
      // Find the member's mobile number
      const member = await User.findOne({ Membership_No: membershipNumber });
      if (!member) {
        return res.status(404).json({
          success: false,
          message: "No member found with this Membership Number",
        });
      }
      mobileNumber = normalizePhoneNumber(member.Mobile_Number);
      otpKey = `${membershipNumber}_${mobileNumber}`;
    } else {
      // Search through stored OTPs
      mobileNumber = normalizePhoneNumber(mobileNumber);
      for (const [key, data] of otpStore.entries()) {
        if (key.endsWith(`_${mobileNumber}`)) {
          otpKey = key;
          break;
        }
      }
      if (!otpKey) {
        return res.status(400).json({
          success: false,
          message: "No OTP found for this mobile number. Please initiate registration first.",
        });
      }
    }

    // Retrieve OTP data
    const otpData = otpStore.get(otpKey);
    console.log(`Retrieved OTP data for resend with key ${otpKey}:`, otpData); // Debug log

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please initiate registration first.",
      });
    }

    // Generate new OTP
    const newOtp = generateOTP();
    otpData.otp = newOtp;
    otpData.createdAt = Date.now();

    // Update OTP store
    otpStore.set(otpKey, otpData);
    console.log(`Updated OTP with key ${otpKey}:`, otpData); // Debug log

    // Send new OTP
    const otpSent = await sendOTP(mobileNumber, newOtp);

    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "New OTP sent to member's mobile number",
      membershipNumber: otpData.guestData?.Membership_No,
      memberMobileNumber: mobileNumber,
      ...(process.env.NODE_ENV !== 'production' && { otp: newOtp })
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
      error: error.message,
    });
  }
};
// Get all guests (unchanged)
export const getAllGuests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const guests = await Guest.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('sponsoredBy', 'Mobile_Number Member_Name');

    const totalGuests = await Guest.countDocuments();
    const totalPages = Math.ceil(totalGuests / limit);

    res.status(200).json({
      success: true,
      data: guests,
      pagination: {
        currentPage: page,
        totalPages,
        totalGuests,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching guests",
      error: error.message
    });
  }
};


// Get guest by ID
export const getGuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findById(id);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    res.status(200).json({
      success: true,
      data: guest
    });

  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching guest",
      error: error.message
    });
  }
};

// Get guest by Membership Number
export const getGuestByMembershipNo = async (req, res) => {
  try {
    const { membershipNo } = req.params;
    const guest = await Guest.find({ Membership_No: membershipNo });

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    res.status(200).json({
      success: true,
      data: guest
    });

  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching guest",
      error: error.message
    });
  }
};

// Update guest
export const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow role change
    delete updateData.role;
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
    const updatedGuest = await Guest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGuest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Guest updated successfully",
      data: updatedGuest
    });

  } catch (error) {
    console.error('Error updating guest:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Guest with this ${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating guest",
      error: error.message
    });
  }
};

// Delete guest
export const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGuest = await Guest.findByIdAndDelete(id);

    if (!deletedGuest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Guest deleted successfully",
      data: deletedGuest
    });

  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting guest",
      error: error.message
    });
  }
};

// Search guests
export const searchGuests = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const guests = await Guest.find({
      $or: [
        { Member_Name: { $regex: query, $options: 'i' } },
        { Membership_No: { $regex: query, $options: 'i' } },
        { Mobile_Number: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);

    res.status(200).json({
      success: true,
      data: guests,
      count: guests.length
    });

  } catch (error) {
    console.error('Error searching guests:', error);
    res.status(500).json({
      success: false,
      message: "Error searching guests",
      error: error.message
    });
  }
};

// Get guests by status
export const getGuestsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!["Pending", "Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be Pending, Active, or Inactive"
      });
    }

    const guests = await Guest.find({ membershipStatus: status })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: guests,
      count: guests.length
    });

  } catch (error) {
    console.error('Error fetching guests by status:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching guests by status",
      error: error.message
    });
  }
};

// Update guest wallet balance
export const updateWalletBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, operation } = req.body; // operation: 'add' or 'subtract'

    if (!amount || !operation) {
      return res.status(400).json({
        success: false,
        message: "Amount and operation are required"
      });
    }

    if (!["add", "subtract"].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Operation must be 'add' or 'subtract'"
      });
    }

    const guest = await Guest.findById(id);
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Guest not found"
      });
    }

    const currentBalance = guest.walletBalance || 0;
    let newBalance;

    if (operation === 'add') {
      newBalance = currentBalance + amount;
    } else {
      newBalance = currentBalance - amount;
      if (newBalance < 0) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance"
        });
      }
    }

    const updatedGuest = await Guest.findByIdAndUpdate(
      id,
      { walletBalance: newBalance },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Wallet balance updated successfully",
      data: {
        previousBalance: currentBalance,
        newBalance: newBalance,
        guest: updatedGuest
      }
    });

  } catch (error) {
    console.error('Error updating wallet balance:', error);
    res.status(500).json({
      success: false,
      message: "Error updating wallet balance",
      error: error.message
    });
  }
};