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

    // Accept various QR payloads: "renewalId:... | ...", lines, or plain text
    let extracted = rawCode;
    const tryExtract = (text) => {
      const t = text.trim();
      // pipe format: key:value | key:value
      if (t.includes('|')) {
        for (const part of t.split('|')) {
          const [k, v] = part.split(':').map(s => (s || '').trim());
          if ((k || '').toLowerCase() === 'renewalid' && v) return v;
        }
      }
      // multi-line format
      if (t.includes('\n')) {
        for (const line of t.split('\n')) {
          const [k, v] = line.split(':').map(s => (s || '').trim());
          if ((k || '').toLowerCase().includes('renewalid') && v) return v;
          if ((k || '').toLowerCase() === 'id' && v) return v;
        }
      }
      // key:value single
      if (t.toLowerCase().startsWith('renewalid:')) {
        return t.substring('renewalid:'.length).trim();
      }
      return t;
    };
    extracted = tryExtract(rawCode);
    const rawNormalized = extracted.toString().trim();
    const upperForHumanCodes = rawNormalized.toUpperCase();

    // 0) Fast-path: if it looks like a Mongo ObjectId, return member by id directly
    const looksLikeObjectId = /^[a-f\d]{24}$/i.test(rawNormalized);
    if (looksLikeObjectId) {
      try {
        const memberDirect = await userModel.findById(rawNormalized);
        if (memberDirect) {
          const response = {
            name: String(memberDirect.Member_Name || ''),
            membership: '',
            phone: String(memberDirect.Mobile_Number || memberDirect['Phone No'] || ''),
            email: String(memberDirect.email || ''),
            wallet: Number(memberDirect.walletBalance ?? 0) || 0,
            memberId: String(memberDirect._id || ''),
            membershipNo: String(memberDirect.Membership_No || ''),
            appNo: memberDirect.App_No ?? null
          };
          return res.status(200).json({ success: true, data: response, source: 'memberById' });
        }
      } catch(_) {}
    }

    // 1) Try renewal by ObjectId string
    let renewal = null;
    try {
      renewal = await Renewal.findById(rawNormalized).populate({
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
          return memNo === upperForHumanCodes || appNo === upperForHumanCodes;
        }) || null;
      });
    }

    // 3) Fallback: find user directly by membership number/app no
    let member = renewal?.membershipId || null;
    if (!member) {
      const queries = [];
      queries.push({ Membership_No: upperForHumanCodes });
      const maybeNum = Number(rawNormalized);
      if (!Number.isNaN(maybeNum)) queries.push({ App_No: maybeNum });
      // also allow scanning of raw MongoId for the member
      try {
        if (!renewal) {
          member = await userModel.findById(rawNormalized);
        }
      } catch (_) {}
      if (!member) {
        // case-insensitive match for membership number (exact OR contains), and trimmed variants
        const escaped = upperForHumanCodes.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const altQueries = [
          { Membership_No: { $regex: `^${escaped}$`, $options: 'i' } },
          { Membership_No: { $regex: escaped, $options: 'i' } },
          { Membership_No: rawNormalized.trim() }
        ];
        // If code matches CCLMSU###, try numeric suffix as App_No
        const m = upperForHumanCodes.match(/CCLMSU\s*0*(\d+)/i);
        if (m && m[1]) {
          altQueries.push({ App_No: Number(m[1]) });
        }
        member = await userModel.findOne({ $or: [...queries, ...altQueries] });
      }
    }

    // 4) If still not found, try fuzzy suggestions by numeric suffix
    let suggestions = [];
    if (!member) {
      try {
        const digits = (upperForHumanCodes.match(/(\d+)/) || [null, ''])[1];
        if (digits) {
          const rx = new RegExp(digits.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
          const maybe = await userModel.find({ Membership_No: { $regex: rx } }).limit(5);
          suggestions = maybe.map(u => ({ id: u._id, membershipNo: u.Membership_No, appNo: u.App_No }));
          if (maybe.length > 0) {
            // if exactly one suggestion, adopt it as match
            if (maybe.length === 1) member = maybe[0];
          }
        }
      } catch(_) {}
    }

    if (!renewal && !member) {
      return res.status(404).json({ success: false, message: 'No matching member or renewal found', debug: { code: rawNormalized, upper: upperForHumanCodes }, suggestions });
    }

    // Consolidate response (even if renewal is missing)
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

    // Normalize membership type/name
    if (renewalData.membershipType && typeof renewalData.membershipType === 'string') {
      renewalData.membershipTypeName = renewalData.membershipType;
      delete renewalData.membershipType;
    }
    if (!renewalData.membershipName && renewalData.membershipTypeName) {
      renewalData.membershipName = renewalData.membershipTypeName;
    }

    // Calculate expiry based on days configured on membership type, or explicit payload
    if (!renewalData.membershipExpairy) {
      let totalDays = 0;
      // 1) explicit days in payload (preferred when admin selects period)
      if (typeof renewalData.day === 'number' && renewalData.day > 0) {
        totalDays = renewalData.day;
      }
      // 2) renewalPeriod.days from UI
      else if (renewalData.renewalPeriod && typeof renewalData.renewalPeriod.days === 'number' && renewalData.renewalPeriod.days > 0) {
        totalDays = renewalData.renewalPeriod.days;
      }
      // 3) lookup by membership type name in Membership collection (membershipday)
      else if (renewalData.membershipTypeName || renewalData.membershipName) {
        try {
          const typeName = renewalData.membershipTypeName || renewalData.membershipName;
          const membership = await Membership.findOne({ type: typeName });
          if (membership && typeof membership.membershipday === 'number' && membership.membershipday > 0) {
            totalDays = membership.membershipday;
          }
        } catch (_) {}
      }

      // 4) Final fallback: 30 days (avoid misleading 1-year default)
      if (!totalDays || Number.isNaN(totalDays)) {
        totalDays = 30;
      }

      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + Number(totalDays));
      renewalData.membershipExpairy = expiry;
      // also capture renewalPeriod.days if not present
      if (!renewalData.renewalPeriod) {
        renewalData.renewalPeriod = { label: `${totalDays} Days`, days: Number(totalDays) };
      } else if (!renewalData.renewalPeriod.days) {
        renewalData.renewalPeriod.days = Number(totalDays);
      }
    }
    
    // Ensure status is set to Pending if not provided
    if (!renewalData.status) {
      renewalData.status = 'Pending';
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




