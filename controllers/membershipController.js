import QRCode from 'qrcode';
import Membership from '../models/membershipModel.js';
import Renewal from '../models/Renewal.js';
import userModel from '../models/User.js';

import Joi from 'joi';

const membershipValidationSchema = Joi.object({
  description: Joi.string().required().messages({
    'string.empty': 'Description is required.',
    'any.required': 'Description is required.',
  }),
  benefits: Joi.array().items(Joi.string()).required().messages({
    'array.base': 'Benefits must be an array of strings.',
    'any.required': 'Benefits are required.',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number.',
    'number.positive': 'Price must be greater than 0.',
    'any.required': 'Price is required.',
  }),
  age: Joi.number().integer().min(0).messages({
    'number.base': 'Age must be a number.',
    'number.min': 'Age must be a positive integer.',
    'any.required': 'Age is required.',
  }),
  type: Joi.string().required().messages({
    'string.empty': 'Type is required.',
    'any.only': 'Type must be one of the following: basic, premium, vip.',
    'any.required': 'Type is required.',
  }),
  membershipday: Joi.number().integer().positive().required().messages({
    'number.base': 'Membership day must be a number.',
    'number.positive': 'Membership day must be greater than 0.',
    'any.required': 'Membership day is required.',
  }),
  discount: Joi.number().integer().positive().required().messages({
    'number.base': 'Discount must be a number.',
    'number.positive': 'Discount must be greater than 0.',
    'any.required': 'Discount is required.',
  }),
  creditLimit: Joi.number().integer().positive().required().messages({
    'number.base': 'Credit Limit  must be a number.',
    'number.positive': 'Credit Limit must be greater than 0.',
    'any.required': 'Credit Limit is required.',
  }),
});


export const createMembership = async (req, res) => {
  try {
    const { description, benefits, price, age, type,discount, membershipday , creditLimit} = req.body;
    const newMembership = new Membership({
      description,
      benefits,
      price,
      type,
      membershipday,
      age,
      creditLimit,
      discount
    });
    const { error } = membershipValidationSchema.validate(req.body, { abortEarly: false });

    if (error) {
      // Return validation errors
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ errors });
    }
    const savedMembership = await newMembership.save();
    res.status(201).json(savedMembership);
  } catch (error) {
    console.error('Error creating membership:', error);
    res.status(500).json({ error: 'Failed to create membership' });
  }
};

// GET all membership plans
export const getMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find();
    res.json(memberships);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
};

// GET membership by ID
export const getMembershipById = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json(membership);
  } catch (error) {
    console.error('Error fetching membership:', error);
    res.status(500).json({ error: 'Failed to fetch membership' });
  }
};

// UPDATE membership
export const updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, benefits, price, type, membershipday, age ,creditLimit} = req.body;
    const updatedMembership = await Membership.findByIdAndUpdate(
      id,
      { description, benefits, price, type, membershipday, age , creditLimit},
      { new: true }
    );
    if (!updatedMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.status(200).json(updatedMembership);
  } catch (error) {
    console.error('Error updating membership:', error);
    res.status(500).json({ error: 'Failed to update membership' });
  }
};

// DELETE membership
export const deleteMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMembership = await Membership.findByIdAndDelete(id);
    if (!deletedMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json({ message: 'Membership deleted successfully' });
  } catch (error) {
    console.error('Error deleting membership:', error);
    res.status(500).json({ error: 'Failed to delete membership' });
  }
};

// POST /api/memberships/renew
export const renewMembership = async (req, res) => {
  try {
    const { userName, membershipId, membershipName, creditLimit,
      discount, benefit, membershipType, day, payId,amount } = req.body;
// console.log("mmm",membershipId);

    const check = await userModel.findByIdAndUpdate(membershipId,{$set:req.body},{new:true});
    if (!check) return res.status(400).json({ error: "Member not found" });
    
    const addDayToDate = (daysToAdd) => {
      // console.log("d--",daysToAdd);
      
      let currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      return currentDate.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    };

    let membershipExpairy = addDayToDate(day); // Adds 1 day to the current date

    // 1) Create a new renewal record (without qrCode for now)
    const newRenewal = new Renewal({
      userName,
      membershipId,
      membershipName,
      membershipType,
      membershipExpairy,
      benefit, payId,
      amount,
      creditLimit,
      discount
    });

    const savedRenewal = await newRenewal.save();

    // 2) Generate a unique string for QR code
    //    For example, embed the renewal's _id or anything you want
    const qrData = `renewalId:${savedRenewal._id} | userName:${userName} | membership:${membershipName}`;

    // 3) Convert to a data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrData);

    // 4) Store the QR code back into the renewal record
    savedRenewal.qrCode = qrCodeDataURL;
    await savedRenewal.save();

    return res.status(201).json(savedRenewal);
  } catch (error) {
    console.error('Error in renewMembership:', error);
    return res.status(500).json({ error: 'Failed to renew membership' });
  }
};

export const getActiveMemberships = async (req, res) => {
  try {
    let id=req.params.id;
    
    const activeMemberships = await Renewal.findOne({ membershipId:id,
      membershipExpairy: { $gt: new Date() } // Only fetch memberships with future expiry dates
    }).sort({_id:-1});

    if (!activeMemberships) {
      return res.status(404).json({ error: "No active memberships found" });
    }

    return res.status(200).json({success:activeMemberships});
  } catch (error) {
    console.error("Error in getActiveMemberships:", error);
    return res.status(500).json({ error: "Failed to fetch active memberships" });
  }
};


export const getAllActivecard=async(req,res)=>{
  try {
    let id=req.params.id;
    
    const activeMemberships = await Renewal.find({ membershipId:id,status:"Approved",
      membershipExpairy: { $gt: new Date() } // Only fetch memberships with future expiry dates
    }).sort({_id:-1});

    // if (!activeMemberships) {
    //   return res.status(404).json({ error: "No active memberships found" });
    // }

    return res.status(200).json({success:activeMemberships});
  } catch (error) {
    console.error("Error in getActiveMemberships:", error);
    return res.status(500).json({ error: "Failed to fetch active memberships" });
  }
}

export const getAllRenewals = async (req, res) => {
  // console.log('getAllRenewals called');
  try {
    const data = await Renewal.find({}).sort({ createdAt: -1 }).populate({
      path: 'membershipId',
      select: '_id Membership_No App_No Member_Name Mobile_Number email walletBalance role status'
    });
    
    // Update renewals with missing benefits by fetching from Membership collection
    const updatedData = await Promise.all(data.map(async (renewal) => {
      // If benefits are empty or missing, try to fetch from Membership
      if (!renewal.benefit || renewal.benefit.length === 0) {
        try {
          const membershipName = renewal.membershipTypeName || renewal.membershipName;
          if (membershipName) {
            // Look for membership by type (matching the membership type name)
            const membership = await Membership.findOne({ type: membershipName });
            if (membership && membership.benefits && membership.benefits.length > 0) {
              // Update the renewal in database with benefits
              renewal.benefit = membership.benefits;
              await renewal.save();
              console.log(`Updated benefits for ${membershipName}:`, membership.benefits);
            }
          }
        } catch (error) {
          console.error('Error fetching benefits for renewal:', error);
          // Continue without updating if lookup fails
        }
      }
      return renewal;
    }));
    
    return res.json(updatedData);
  } catch (error) {
    console.error('Error in getAllRenewals:', error);
    return res.status(500).json({ error: 'Failed to fetch renewals' });
  }
};

// Scan helper: return consolidated member details by renewal id or membership number
export const scanMembershipByCode = async (req, res) => {
  try {
    const rawCode = (req.params.code || '').toString().trim();
    if (!rawCode) {
      return res.status(400).json({ success: false, message: 'Scan code is required' });
    }

    const code = rawCode.toUpperCase();

    // 1) Try renewal by ObjectId string
    let renewal = null;
    try {
      renewal = await Renewal.findById(code).populate({
        path: 'membershipId',
        select: '_id Membership_No App_No Member_Name Mobile_Number email walletBalance role status'
      });
    } catch (_) {
      // not an ObjectId; ignore
    }

    // 2) If not found, try renewal by membership numbers
    if (!renewal) {
      renewal = await Renewal.findOne({}).populate({
        path: 'membershipId',
        select: '_id Membership_No App_No Member_Name Mobile_Number email walletBalance role status'
      }).then(async (first) => {
        // We need an actual filter; do separate query to leverage populated membership fields
        const renewals = await Renewal.find({}).sort({ createdAt: -1 }).populate({
          path: 'membershipId',
          select: '_id Membership_No App_No Member_Name Mobile_Number email walletBalance role status'
        });
        return renewals.find(r => {
          const memNo = (r?.membershipId?.Membership_No || '').toString().trim().toUpperCase();
          const appNo = (r?.membershipId?.App_No || '').toString().trim().toUpperCase();
          return memNo === code || appNo === code;
        }) || null;
      });
    }

    // 3) Fallback: find user directly by membership number/app no
    let member = renewal?.membershipId || null;
    if (!member) {
      member = await userModel.findOne({
        $or: [
          { Membership_No: code },
          { App_No: isNaN(Number(code)) ? undefined : Number(code) }
        ].filter(Boolean)
      });
    }

    if (!renewal && !member) {
      return res.status(404).json({ success: false, message: 'No matching member or renewal found' });
    }

    // Consolidate response
    const response = {
      name: String(member?.Member_Name || renewal?.userName || ''),
      membership: String(renewal?.membershipTypeName || renewal?.membershipName || ''),
      phone: String(member?.Mobile_Number || member?.['Phone No'] || ''),
      email: String(member?.email || ''),
      wallet: Number(member?.walletBalance ?? 0) || 0,
      memberId: String(member?._id || ''),
      membershipNo: String(member?.Membership_No || ''),
      appNo: member?.App_No ?? null
    };

    return res.status(200).json({ success: true, data: response });
  } catch (error) {
    console.error('scanMembershipByCode error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createRenewal = async (req, res) => {
  try {
    const renewalData = req.body;
    
    // Add default expiry date if not provided (1 year from now)
    if (!renewalData.membershipExpairy) {
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      renewalData.membershipExpairy = defaultExpiry;
    }
    
    // Ensure status is set to Pending if not provided
    if (!renewalData.status) {
      renewalData.status = 'Pending';
    }
    
    // Handle membershipType - if it's a string, store it as membershipTypeName
    if (renewalData.membershipType && typeof renewalData.membershipType === 'string') {
      // Store the string value as membershipTypeName
      renewalData.membershipTypeName = renewalData.membershipType;
      // Remove membershipType since it expects ObjectId
      delete renewalData.membershipType;
    }
    
    // If membershipName is not set, use membershipTypeName
    if (!renewalData.membershipName && renewalData.membershipTypeName) {
      renewalData.membershipName = renewalData.membershipTypeName;
    }
    
    // Fetch benefits from Membership collection if not provided
    if (!renewalData.benefit || renewalData.benefit.length === 0) {
      try {
        const membershipName = renewalData.membershipTypeName || renewalData.membershipName;
        // Look for membership by type (matching the membership type name)
        const membership = await Membership.findOne({ type: membershipName });
        if (membership && membership.benefits && membership.benefits.length > 0) {
          renewalData.benefit = membership.benefits;
          console.log(`Fetched benefits for ${membershipName}:`, membership.benefits);
        }
      } catch (error) {
        console.error('Error fetching benefits from membership:', error);
        // Continue without benefits if lookup fails
      }
    }
    
    const renewal = new Renewal(renewalData);
    await renewal.save();

    res.json({ 
      success: true, 
      renewalId: renewal._id,
      message: 'Renewal created successfully',
      _id: renewal._id,
      id: renewal._id
    });
  } catch (error) {
    console.error('Error creating renewal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

export const changeMemberStatus = async(req,res) =>{
  try {
    const { status } = req.body;

    const renewal = await Renewal.findById(req.params.id);
    
    if (!renewal) {
      return res.status(404).json({ message: "Membership not found" });
    }

    // Update status
    renewal.status = status;
    
    // If status is being changed to "Approved", generate or update QR code
    if (status === "Approved" && !renewal.qrCode) {
      // Generate QR code with renewal data
      const qrData = `renewalId:${renewal._id} | userName:${renewal.userName} | membership:${renewal.membershipName}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData);
      renewal.qrCode = qrCodeDataURL;
    }
    
    // Save the updated renewal
    await renewal.save();

    res.json({ message: "Status updated", renewal: renewal });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}




