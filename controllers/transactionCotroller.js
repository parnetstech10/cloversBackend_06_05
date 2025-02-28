// controllers/transactionController.js
import mongoose from 'mongoose';
import Transaction from '../models/transactionModel.js';

// Get all transactions
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });
    
    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get single transaction (now supports lookup by ID or transactionId)
export const getTransaction = async (req, res) => {
  try {
    // Check if the param is a MongoDB ObjectId or a custom transactionId
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    
    let transaction;
    if (isObjectId) {
      transaction = await Transaction.findById(req.params.id);
    } else {
      transaction = await Transaction.findOne({ transactionId: req.params.id });
    }
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add transaction
export const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date,userId } = req.body;
    
    const transaction = await Transaction.create({
      amount,
      type,
      category,
      description,
      date: date || Date.now(),
      user: userId
    });
    
    return res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Update transaction (now supports lookup by ID or transactionId)
export const updateTransaction = async (req, res) => {
  try {
    // Check if the param is a MongoDB ObjectId or a custom transactionId
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    
    let transaction;
    if (isObjectId) {
      transaction = await Transaction.findById(req.params.id);
    } else {
      transaction = await Transaction.findOne({ transactionId: req.params.id });
    }
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    // Update the transaction
    // Note: Don't allow updating the transactionId field
    const updateData = { ...req.body };
    delete updateData.transactionId;  // Prevent changing the ID
    
    transaction = await Transaction.findByIdAndUpdate(transaction._id, updateData, {
      new: true,
      runValidators: true
    });
    
    return res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Delete transaction (now supports lookup by ID or transactionId)
export const deleteTransaction = async (req, res) => {
  try {
    // Check if the param is a MongoDB ObjectId or a custom transactionId
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    
    let transaction;
    if (isObjectId) {
      transaction = await Transaction.findById(req.params.id);
    } else {
      transaction = await Transaction.findOne({ transactionId: req.params.id });
    }
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    // Check if transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    await transaction.deleteOne();
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Fix: Import mongoose for ObjectId validation
