import asyncHandler from 'express-async-handler';
import SubAdminModel from '../models/subAdmin.js';
import bcrypt from 'bcryptjs';

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
    const { name, email, role, password, permissions, username } = req.body || {};

    if (!name || !email || !role) {
        res.status(400);
        throw new Error('Name, email and role are required');
    }
    if (!password) {
        res.status(400);
        throw new Error('Password is required');
    }

    // Check for duplicate email/username
    const existingByEmail = await SubAdminModel.findOne({ email });
    if (existingByEmail) {
        res.status(400);
        throw new Error('Email already in use');
    }
    if (username) {
        const existingByUsername = await SubAdminModel.findOne({ username });
        if (existingByUsername) {
            res.status(400);
            throw new Error('Username already in use');
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const subAdmin = new SubAdminModel({
        name,
        email,
        role,
        username: username || undefined,
        password: hashedPassword,
        permissions: Array.isArray(permissions) ? permissions : [],
    });

    const newSubAdmin = await subAdmin.save();
    // Omit password in response
    const { password: _pw, ...safe } = newSubAdmin.toObject();
    res.status(201).json(safe);
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
