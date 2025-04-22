// File: controllers/walletController.js - Wallet operations
import UserModel from '../models/User.js';
import TransactionModel from '../models/transactionModel.js';

// Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add money to wallet (Admin only)
export const addMoney = async (req, res) => {
  try {
    const { user, amount, description, category } = req.body;
    console.log(user, amount, description)
    if (!user || !amount || amount <= 0 || !description) {
      return res.status(400).json({ message: 'Please provide user, valid amount, and description' });
    }
    
    const usercheck = await UserModel.findById(user);
    
    if (!usercheck) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user's wallet balance
    const previousBalance = usercheck.walletBalance;
    usercheck.walletBalance += parseFloat(amount);
    await usercheck.save();
    
    // Create transaction record
    const transactionData = {
      user: usercheck._id,
      type: 'bonus',
      amount: parseFloat(amount),
      description,
      category: category || 'wallet',
      balanceAfter: usercheck.walletBalance
    };
    
    // Add performedBy if authenticated user exists
    if (req.user && req.user.id) {
      transactionData.performedBy = req.user.id;
    }
    
    const transaction = new TransactionModel(transactionData);
    await transaction.save();
    
    res.status(200).json({
      message: 'Money added successfully',
      transaction,
      previousBalance,
      newBalance: usercheck.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Deduct money from wallet (Admin only)
export const deductMoney = async (req, res) => {
  try {
    const { user, amount, description, category } = req.body;
    
    if (!user || !amount || amount <= 0 || !description) {
      return res.status(400).json({ message: 'Please provide user, valid amount, and description' });
    }
    
    const usercheck = await UserModel.findById(user);
    
    if (!usercheck) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (usercheck.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Update user's wallet balance
    const previousBalance = usercheck.walletBalance;
    usercheck.walletBalance -= parseFloat(amount);
    await usercheck.save();
    
    // Create transaction record
    const transactionData = {
      user: usercheck._id,
      type: 'debit',
      amount: parseFloat(amount),
      description,
      category: category || 'wallet',
      balanceAfter: usercheck.walletBalance
    };
    
    // Add performedBy if authenticated user exists
    if (req.user && req.user.id) {
      transactionData.performedBy = req.user.id;
    }
    
    const transaction = new TransactionModel(transactionData);
    await transaction.save();
    
    res.status(200).json({
      message: 'Money deducted successfully',
      transaction,
      previousBalance,
      newBalance: usercheck.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get transaction history for a user
export const getTransactionHistory = async (req, res) => {
  try {
    const user = req.params.user;
    
    // Special case for 'all' - return all transactions (admin only)
    if (user === 'all') {
      const transactions = await TransactionModel.find({})
        .sort({ createdAt: -1 })
        .populate('user', 'Member_Name')
        .populate('performedBy', 'name email');
      
      return res.status(200).json(transactions);
    }
    
    // Regular case - single user transactions
    if (!user) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const transactions = await TransactionModel.find({ user })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email');
    
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};