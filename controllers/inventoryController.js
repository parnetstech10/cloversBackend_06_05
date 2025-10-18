import Inventory, { InventoryLog } from "../models/Inventory.js";
import mongoose from "mongoose";

// Get all inventory items with optional category filter
export const getAllInventory = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } }
      ];
    }
    
    const inventory = await Inventory.find(query).sort({ itemName: 1 });
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get inventory by category
export const getInventoryByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`Fetching inventory for category: ${category}`);
    
    // First, let's check if there are ANY items in the inventory collection
    const totalItems = await Inventory.countDocuments();
    console.log(`Total items in inventory collection: ${totalItems}`);
    
    // Use case-insensitive query
    const inventory = await Inventory.find({ 
      category: { $regex: new RegExp(`^${category}$`, 'i') } 
    }).sort({ itemName: 1 });
    
    console.log(`Found ${inventory.length} items for category ${category}:`, inventory.map(item => ({ name: item.itemName, stock: item.currentStock })));
    
    // Also log all items regardless of category for debugging
    const allItems = await Inventory.find({}).sort({ itemName: 1 });
    console.log(`All items in inventory:`, allItems.map(item => ({ name: item.itemName, category: item.category, stock: item.currentStock })));
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error(`Error fetching inventory for category ${category}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// Get single inventory item
export const getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new inventory item
export const createInventoryItem = async (req, res) => {
  try {
    const inventoryItem = new Inventory(req.body);
    await inventoryItem.save();
    res.status(201).json(inventoryItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Inventory.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Adjust stock manually
export const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const adjustmentData = req.body;
    
    const updatedItem = await Inventory.adjustStock(id, adjustmentData);
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get inventory logs for an item
export const getInventoryLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const logs = await InventoryLog.find({ inventoryId: id })
      .sort({ timestamp: -1 })
      .limit(50);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await Inventory.findLowStockItems();
    res.status(200).json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const [
      totalItems,
      lowStockItems,
      criticalItems,
      categoryBreakdown,
      recentMovements
    ] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments({ 
        $and: [
          { currentStock: { $gt: 0 } },
          { currentStock: { $lte: '$reorderLevel' } }
        ]
      }),
      Inventory.countDocuments({ currentStock: 0 }),
      Inventory.aggregate([
        {
          $group: {
            _id: '$category',
            items: { $sum: 1 },
            value: { $sum: '$totalValue' },
            lowStock: {
              $sum: {
                $cond: [
                  { $or: [
                    { $eq: ['$currentStock', 0] },
                    { $lte: ['$currentStock', '$reorderLevel'] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      InventoryLog.find()
        .populate('inventoryId', 'itemName category')
        .sort({ timestamp: -1 })
        .limit(10)
    ]);

    const totalValue = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]);

    const monthlyTrends = await InventoryLog.aggregate([
      {
        $group: {
          _id: {
            category: '$type',
            month: { $month: '$timestamp' },
            year: { $year: '$timestamp' }
          },
          totalChange: { $sum: '$adjustedQty' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          currentMonth: {
            $sum: {
              $cond: [
                { $eq: ['$_id.month', new Date().getMonth() + 1] },
                '$totalChange',
                0
              ]
            }
          },
          lastMonth: {
            $sum: {
              $cond: [
                { $eq: ['$_id.month', new Date().getMonth()] },
                '$totalChange',
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      totalItems,
      totalValue: totalValue[0]?.total || 0,
      lowStockItems,
      criticalStockItems: criticalItems,
      categoryBreakdown: {
        bar: categoryBreakdown.find(c => c._id === 'Bar') || { items: 0, value: 0, lowStock: 0 },
        restaurant: categoryBreakdown.find(c => c._id === 'Restaurant') || { items: 0, value: 0, lowStock: 0 },
        general: categoryBreakdown.find(c => c._id === 'General') || { items: 0, value: 0, lowStock: 0 }
      },
      recentMovements: recentMovements.map(log => ({
        _id: log._id,
        timestamp: log.timestamp,
        itemName: log.inventoryId?.itemName,
        type: log.grnId ? 'GRN' : 'Adjustment',
        quantity: log.adjustedQty,
        reference: log.reference
      })),
      monthlyTrends
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get movement statistics for an item
export const getMovementStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await InventoryLog.aggregate([
      { $match: { inventoryId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalReceived: {
            $sum: {
              $cond: [{ $gt: ['$adjustedQty', 0] }, '$adjustedQty', 0]
            }
          },
          totalUsed: {
            $sum: {
              $cond: [{ $lt: ['$adjustedQty', 0] }, { $abs: '$adjustedQty' }, 0]
            }
          },
          totalAdjusted: {
            $sum: { $abs: '$adjustedQty' }
          },
          averageMonthlyUsage: {
            $avg: {
              $cond: [{ $lt: ['$adjustedQty', 0] }, { $abs: '$adjustedQty' }, 0]
            }
          }
        }
      }
    ]);

    res.status(200).json(stats[0] || {
      totalReceived: 0,
      totalUsed: 0,
      totalAdjusted: 0,
      averageMonthlyUsage: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update inventory from GRN (called when GRN status changes to "Received")
export const updateInventoryFromGRN = async (grnItems, grnId) => {
  try {
    await Inventory.updateStockFromGRN(grnItems, grnId);
    return { success: true };
  } catch (error) {
    console.error('Error updating inventory from GRN:', error);
    return { success: false, error: error.message };
  }
};

// Test endpoint to manually create an inventory item
export const testCreateInventory = async (req, res) => {
  try {
    console.log('Testing inventory creation...');
    const testItem = await Inventory.create({
      itemName: 'Test Item',
      category: 'Bar',
      unit: 'pcs',
      currentStock: 10,
      reorderLevel: 5,
      supplier: 'Test Supplier',
      costPerUnit: 100,
      totalValue: 1000
    });
    console.log('Test item created:', testItem);
    res.status(201).json({ success: true, data: testItem });
  } catch (error) {
    console.error('Error creating test item:', error);
    res.status(500).json({ error: error.message });
  }
};
