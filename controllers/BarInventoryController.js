import BarInventory from '../models/BarInventory.js';

// Add new bar inventory item
export const addItem = async (req, res) => {
  try {
    const {
      itemName,
      category,
      brand,
      volume,
      unit,
      pricePerUnit,
      stockQuantity,
      minStockThreshold,
      supplier,
      purchaseHistory,
      usageLogs,
      status
    } = req.body;

    const newItem = new BarInventory({
      itemName,
      category,
      brand,
      volume,
      unit,
      pricePerUnit,
      stockQuantity,
      minStockThreshold,
      supplier,
      purchaseHistory,
      usageLogs,
      status: status || "Available" // Default to "Available" if not provided
    });

    await newItem.save();
    res.status(201).json({
      success: true,
      message: 'Item added successfully!',
      data: newItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all inventory items
export const getAllItems = async (req, res) => {
  try {
    const items = await BarInventory.find();
    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single inventory item by ID
export const getItemById = async (req, res) => {
  try {
    const item = await BarInventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update an existing inventory item
export const updateItem = async (req, res) => {
  try {
    const { 
      itemName, 
      category, 
      brand, 
      volume, 
      unit, 
      pricePerUnit, 
      stockQuantity, 
      minStockThreshold, 
      supplier, 
      purchaseHistory, 
      usageLogs,
      status
    } = req.body;

    const updatedItem = await BarInventory.findByIdAndUpdate(
      req.params.id,
      {
        itemName,
        category,
        brand,
        volume,
        unit,
        pricePerUnit,
        stockQuantity,
        minStockThreshold,
        supplier,
        purchaseHistory,
        usageLogs,
        status
      },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete an inventory item
export const deleteItem = async (req, res) => {
  try {
    const deletedItem = await BarInventory.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update stock quantity
export const updateStock = async (req, res) => {
  try {
    const { quantity, purpose } = req.body;

    const updatedItem = await BarInventory.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { stockQuantity: quantity },
        $push: {
          usageLogs: {
            date: new Date(),
            quantityUsed: quantity,
            purpose: purpose || "Sale"
          }
        },
        lastStockUpdate: new Date()
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Update the status of the item based on the new stock level
    if (updatedItem.stockQuantity === 0) {
      updatedItem.status = "Out of Stock";
    } else if (updatedItem.stockQuantity < updatedItem.minStockThreshold) {
      updatedItem.status = "Low Stock";
    } else {
      updatedItem.status = "Available";
    }

    await updatedItem.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: updatedItem
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
