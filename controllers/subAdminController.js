import asyncHandler from 'express-async-handler';
import SubAdminModel from '../models/subAdmin.js';

// Get All Sub Admins
export const getSubAdmins = asyncHandler(async (req, res) => {
    const subAdmins = await SubAdminModel.find();
    res.status(200).json(subAdmins);
});

// Get Single Sub Admin by subAdminId
export const getSubAdminById = asyncHandler(async (req, res) => {
    const subAdmin = await SubAdminModel.findOne({ subAdminId: req.params.id });

    if (!subAdmin) {
        res.status(404);
        throw new Error('Sub Admin not found');
    }

    res.status(200).json(subAdmin);
});

// Create a New Sub Admin
export const createSubAdmin = asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;

    // Check for duplicate email
    const existingSubAdmin = await SubAdminModel.findOne({ email });
    if (existingSubAdmin) {
        res.status(400);
        throw new Error('Email already in use');
    }

    const subAdmin = new SubAdminModel({ name, email, role });

    const newSubAdmin = await subAdmin.save();
    res.status(201).json(newSubAdmin);
});

// Update Sub Admin by subAdminId
export const updateSubAdmin = asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;

    const updatedSubAdmin = await SubAdminModel.findOneAndUpdate(
        { subAdminId: req.params.id },
        { $set: { name, email, role } },
        { new: true, runValidators: true }
    );

    if (!updatedSubAdmin) {
        res.status(404);
        throw new Error('Sub Admin not found');
    }

    res.status(200).json(updatedSubAdmin);
});

// Delete Sub Admin by subAdminId
export const deleteSubAdmin = asyncHandler(async (req, res) => {
    const subAdmin = await SubAdminModel.findOneAndDelete({ subAdminId: req.params.id });

    if (!subAdmin) {
        res.status(404);
        throw new Error('Sub Admin not found');
    }

    res.status(200).json({ message: 'Sub Admin deleted successfully' });
});
