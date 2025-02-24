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
});


export const createMembership = async (req, res) => {
  try {
    const { description, benefits, price, age, type, membershipday } = req.body;
    const newMembership = new Membership({
      description,
      benefits,
      price,
      type,
      membershipday,
      age
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
    const { description, benefits, price, type, membershipday, age } = req.body;
    const updatedMembership = await Membership.findByIdAndUpdate(
      id,
      { description, benefits, price, type, membershipday, age },
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
    const { userName, membershipId, membershipName, benefit, membershipType, day, payId,amount } = req.body;
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
      amount
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
    console.log("id",id);
    
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

export const getAllRenewals = async (req, res) => {
  // console.log('getAllRenewals called');
  try {
    const data = await Renewal.find().sort({ createdAt: -1 });
    console.log('Renewals fetched:', data); // debug log
    return res.json(data);
  } catch (error) {
    console.error('Error in getAllRenewals:', error);
    return res.status(500).json({ error: 'Failed to fetch renewals' });
  }
};
