import InventoryDistribution from "../models/InventoryDistribution.js";
import Inventory, { InventoryLog } from "../models/Inventory.js";
import mongoose from "mongoose";

// Middleware to check if user is admin
const checkAdminAccess = (req, res, next) => {
  console.log("checkAdminAccess - req.user:", req.user);
  console.log("checkAdminAccess - req.user.role:", req.user?.role);
  console.log("checkAdminAccess - req.user.username:", req.user?.username);
  
  // Assuming you have user role in req.user (from auth middleware)
  if (!req.user) {
    console.log("No user found in request");
    return res.status(403).json({ 
      error: 'Access denied. No user found in request.' 
    });
  }
  
  // Check if user is admin based on different models:
  // 1. AdminModel - if it exists, it's an admin (no role field)
  // 2. SubAdminModel - check if role is Manager, Assistant, or Co-ordinator
  // 3. User - check if role is Admin
  const isAdmin = 
    req.user.username || // AdminModel (has username, no role field)
    (req.user.role && ['Manager', 'Assistant', 'Co-ordinator'].includes(req.user.role)) || // SubAdminModel
    req.user.role === 'Admin'; // User model
  
  if (!isAdmin) {
    console.log("User is not authorized as admin. User details:", {
      role: req.user.role,
      username: req.user.username,
      name: req.user.name || req.user.Member_Name
    });
    return res.status(403).json({ 
      error: 'Access denied. Only administrators can distribute inventory items.' 
    });
  }
  
  console.log("Admin access granted");
  next();
};

// Create new inventory distribution
export const createDistribution = async (req, res) => {
  try {
    console.log("Creating inventory distribution:", req.body);
    
    const {
      recipientType,
      recipientId,
      recipientName,
      recipientContact,
      items,
      purpose,
      notes,
      department,
      location
    } = req.body;

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item must be selected for distribution' });
    }

    if (!recipientName || !purpose) {
      return res.status(400).json({ error: 'Recipient name and purpose are required' });
    }

    // Process each item and validate stock availability
    const processedItems = [];
    const inventoryUpdates = [];

    for (const item of items) {
      const inventoryItem = await Inventory.findById(item.inventoryId);
      if (!inventoryItem) {
        return res.status(404).json({ 
          error: `Inventory item not found: ${item.itemName}` 
        });
      }

      if (inventoryItem.currentStock < item.quantityDistributed) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.itemName}. Available: ${inventoryItem.currentStock}, Requested: ${item.quantityDistributed}` 
        });
      }

      // Prepare processed item
      const processedItem = {
        inventoryId: item.inventoryId,
        itemName: inventoryItem.itemName,
        category: inventoryItem.category,
        unit: inventoryItem.unit,
        quantityDistributed: item.quantityDistributed,
        unitCost: inventoryItem.costPerUnit,
        totalCost: item.quantityDistributed * inventoryItem.costPerUnit,
        previousStock: inventoryItem.currentStock,
        newStock: inventoryItem.currentStock - item.quantityDistributed
      };

      processedItems.push(processedItem);

      // Prepare inventory update
      inventoryUpdates.push({
        inventoryId: item.inventoryId,
        quantityChange: -item.quantityDistributed,
        reason: `Distribution to ${recipientName} - ${purpose}`,
        reference: `DIST-${Date.now()}`,
        adjustedBy: req.user.Member_Name || req.user.username || req.user.name || req.user.email
      });
    }

    // Create distribution record
    const distribution = new InventoryDistribution({
      distributedBy: req.user._id,
      distributedByName: req.user.Member_Name || req.user.username || req.user.name || req.user.email,
      recipientType,
      recipientId,
      recipientName,
      recipientContact,
      items: processedItems,
      purpose,
      notes,
      department,
      location,
      status: 'Completed' // Auto-complete for admin distributions
    });

    console.log("Distribution object before save:", distribution);
    console.log("Processed items:", processedItems);
    
    await distribution.save();

    // Update inventory quantities
    console.log("Updating inventory quantities:", inventoryUpdates);
    for (const update of inventoryUpdates) {
      try {
        console.log("Adjusting stock for inventory:", update.inventoryId, "with change:", update.quantityChange);
        await Inventory.adjustStock(update.inventoryId, {
          quantityChange: update.quantityChange,
          reason: update.reason,
          adjustedBy: update.adjustedBy,
          reference: update.reference
        });
        console.log("Stock adjustment successful for:", update.inventoryId);
      } catch (adjustError) {
        console.error("Error adjusting stock for inventory:", update.inventoryId, adjustError);
        throw adjustError;
      }
    }

    // Populate the response
    const populatedDistribution = await InventoryDistribution.findById(distribution._id)
      .populate('items.inventoryId', 'itemName category unit');

    console.log("Distribution created successfully:", populatedDistribution);

    res.status(201).json({
      success: true,
      message: 'Inventory distribution created successfully',
      data: populatedDistribution
    });

  } catch (error) {
    console.error('Error creating distribution:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create inventory distribution' 
    });
  }
};

// Get all distributions with filters
export const getAllDistributions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      recipientType, 
      status, 
      startDate, 
      endDate,
      search 
    } = req.query;

    let query = {};

    // Apply filters
    if (recipientType) query.recipientType = recipientType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { distributionId: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate && endDate) {
      query.distributionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const distributions = await InventoryDistribution.find(query)
      .populate('items.inventoryId', 'itemName category unit')
      .sort({ distributionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryDistribution.countDocuments(query);

    res.status(200).json({
      success: true,
      data: distributions,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching distributions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch distributions' 
    });
  }
};

// Get single distribution
export const getDistribution = async (req, res) => {
  try {
    const { id } = req.params;
    
    const distribution = await InventoryDistribution.findById(id)
      .populate('items.inventoryId', 'itemName category unit');

    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    res.status(200).json({
      success: true,
      data: distribution
    });

  } catch (error) {
    console.error('Error fetching distribution:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch distribution' 
    });
  }
};

// Update distribution status
export const updateDistributionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const distribution = await InventoryDistribution.findById(id);
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Only allow status updates by admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only administrators can update distribution status' 
      });
    }

    distribution.status = status;
    if (notes) distribution.notes = notes;
    
    if (status === 'Approved') {
      distribution.approvedBy = req.user._id;
      distribution.approvedAt = new Date();
    }

    await distribution.save();

    res.status(200).json({
      success: true,
      message: 'Distribution status updated successfully',
      data: distribution
    });

  } catch (error) {
    console.error('Error updating distribution status:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update distribution status' 
    });
  }
};

// Delete distribution (only if status is Pending)
export const deleteDistribution = async (req, res) => {
  try {
    const { id } = req.params;

    const distribution = await InventoryDistribution.findById(id);
    if (!distribution) {
      return res.status(404).json({ error: 'Distribution not found' });
    }

    // Only allow deletion of pending distributions
    if (distribution.status !== 'Pending') {
      return res.status(400).json({ 
        error: 'Only pending distributions can be deleted' 
      });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only administrators can delete distributions' 
      });
    }

    await InventoryDistribution.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Distribution deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting distribution:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete distribution' 
    });
  }
};

// Get distribution statistics
export const getDistributionStats = async (req, res) => {
  try {
    const stats = await InventoryDistribution.getDistributionStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching distribution stats:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch distribution statistics' 
    });
  }
};

// Get distributions by recipient
export const getDistributionsByRecipient = async (req, res) => {
  try {
    const { recipientId } = req.params;
    
    const distributions = await InventoryDistribution.findByRecipient(recipientId)
      .populate('distributedBy', 'name email')
      .populate('items.inventoryId', 'itemName category unit')
      .sort({ distributionDate: -1 });

    res.status(200).json({
      success: true,
      data: distributions
    });

  } catch (error) {
    console.error('Error fetching recipient distributions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch recipient distributions' 
    });
  }
};

// Get available inventory items for distribution
export const getAvailableItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = { currentStock: { $gt: 0 } }; // Only items with stock
    
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Inventory.find(query)
      .select('itemName category unit currentStock costPerUnit supplier location')
      .sort({ itemName: 1 });

    res.status(200).json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error fetching available items:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch available items' 
    });
  }
};

export { checkAdminAccess };
