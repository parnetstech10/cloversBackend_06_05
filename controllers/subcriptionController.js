import Membership from '../models/subscriptionModel.js';
import { body, validationResult } from 'express-validator';

export const validateMembership = [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isNumeric().withMessage('Price must be a number').notEmpty().withMessage('Price is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('duration').optional().isNumeric().withMessage('Duration must be a number'),
  body('discount').optional().isNumeric().withMessage('Discount must be a number'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('sport').optional().isString().withMessage('Sport must be a string'),
  body('subscriptiontype').notEmpty().isString().withMessage('Subscription type must be a string'),
];

// export const createMembership = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ error: errors.array() });
//   }

//   try {
//     const membership = new Membership(req.body);
//     const savedMembership = await membership.save();
//   return  res.status(201).json(savedMembership);
//   } catch (err) {
//     res.status(500).json({ error: 'Internal Server Error '+err.message });
//   }
// };



export const createMembership = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const lastMembership = await Membership.findOne().sort({ createdAt: -1 });
    let newSubscriptionID = 'CCLMSUB001';

    if (lastMembership && lastMembership.subscriptionID) {
      const lastIdNumber = parseInt(lastMembership.subscriptionID.replace('CCLMSUB', ''), 10);
      newSubscriptionID = `CCLMSUB${String(lastIdNumber + 1).padStart(3, '0')}`;
    }

    const membership = new Membership({ ...req.body, subscriptionID: newSubscriptionID });
    const savedMembership = await membership.save();
    
    return res.status(201).json(savedMembership);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};





export const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find().sort({});
  return  res.status(200).json(memberships);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

export const getallsubcrtionbytype=async(req,res)=>{
  try {
    let data=await Membership.find({subscriptiontype:req.params.type}).sort({_id:-1});
    return res.status(200).json({success:data});
  } catch (error) {
    console.log(error);
  }
}

export const getallsubcrtionbs=async(req,res)=>{
  try {
    let data=await Membership.find({}).sort({_id:-1});
    return res.status(200).json({success:data});
  } catch (error) {
    console.log(error);
  }
}

export const getMembershipById = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
  return  res.status(200).json({success:membership});
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

export const updateMembershipById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedMembership = await Membership.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.status(200).json(updatedMembership);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

export const deleteMembershipById = async (req, res) => {
  try {
    const deletedMembership = await Membership.findByIdAndDelete(req.params.id);
    if (!deletedMembership) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.status(200).json({ message: 'Membership deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
