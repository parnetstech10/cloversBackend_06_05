import BarInventoryModel from "../models/BarInventoryModel.js";
import BarRecipeModel from "../models/barRecipeModel.js";

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
      supplierName,
      supplierContact,
      supplierEmail,
      supplierAddress,
      lastStockUpdate,
      purchaseHistory,
      usageLogs,
      status,
    } = req.body;

    const newItem = new BarInventoryModel({
      itemName,
      category,
      brand,
      volume,
      unit,
      pricePerUnit,
      stockQuantity,
      minStockThreshold,
      supplierName,
      supplierContact,
      supplierEmail,
      supplierAddress,
      lastStockUpdate,
      purchaseHistory,
      usageLogs,
      status: status || "Available", // Default to "Available" if not provided
    });

    await newItem.save();
    res.status(201).json({
      success: true,
      message: "Item added successfully!",
      data: newItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all inventory items
export const getAllItems = async (req, res) => {
  try {
    const items = await BarInventoryModel.find().sort({ _id: -1 });
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single inventory item by ID
export const getItemById = async (req, res) => {
  try {
    const item = await BarInventoryModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
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
      status,
    } = req.body;

    const updatedItem = await BarInventoryModel.findByIdAndUpdate(
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
        status,
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an inventory item
export const deleteItem = async (req, res) => {
  try {
    const deletedItem = await BarInventoryModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update stock quantity
export const updateStock = async (req, res) => {
  try {
    const { quantity, purpose } = req.body;

    const updatedItem = await BarInventoryModel.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { stockQuantity: quantity },
        $push: {
          usageLogs: {
            date: new Date(),
            quantityUsed: quantity,
            purpose: purpose || "Sale",
          },
        },
        lastStockUpdate: new Date(),
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
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
      message: "Stock updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Add a recipe for a bar item
export const addBarRecipe = async (req, res) => {
  try {
    const { menuItemName, measure, ingredients } = req.body;
    
    if (!menuItemName || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        message: "Menu item name and ingredients array are required"
      });
    }
    
    // Check if recipe already exists
    const existingRecipe = await BarRecipeModel.findOne({ 
      menuItemName, 
      ...(measure ? { measure } : {})
    });
    
    if (existingRecipe) {
      return res.status(400).json({
        success: false,
        message: "Recipe already exists for this item"
      });
    }
    
    // Create new recipe
    const newRecipe = new BarRecipeModel({
      menuItemName,
      measure,
      ingredients
    });
    
    await newRecipe.save();
    
    res.status(201).json({
      success: true,
      message: "Bar recipe added successfully",
      data: newRecipe
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all bar recipes
export const getAllBarRecipes = async (req, res) => {
  try {
    const recipes = await BarRecipeModel.find()
      .populate('ingredients.inventoryItemId', 'itemName brand unit');
    
    res.status(200).json({
      success: true,
      data: recipes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Deduct from inventory when order is served
// export const deductFromBarOrder = async (req, res) => {
//   try {
//     const { orderItems } = req.body;
    
//     if (!orderItems || !Array.isArray(orderItems)) {
//       return res.status(400).json({
//         success: false,
//         message: "Order items are required"
//       });
//     }
    
//     const updateLog = [];
    
//     // Process each item in the order
//     for (const item of orderItems) {
//       const recipe = await BarRecipeModel.findOne({ 
//         menuItemName: item.name,
//         ...(item.measure ? { measure: item.measure } : {})
//       });
      
//       if (!recipe) {
//         updateLog.push(`No recipe found for item: ${item.name} ${item.measure || ''}`);
//         continue;
//       }
      
//       for (const ingredient of recipe.ingredients) {
//         const amountToDeduct = ingredient.amount * item.quantity;
        
//         const inventoryItem = await BarInventoryModel.findById(ingredient.inventoryItemId);
        
//         if (!inventoryItem) {
//           updateLog.push(`Inventory item not found: ${ingredient.inventoryItemId}`);
//           continue;
//         }
        
//         const updatedQuantity = Math.max(0, inventoryItem.stockQuantity - amountToDeduct);
//         inventoryItem.stockQuantity = updatedQuantity;
        
//         inventoryItem.usageLogs.push({
//           date: new Date(),
//           quantityUsed: amountToDeduct,
//           purpose: `Bar order: ${item.name} ${item.measure || ''} x${item.quantity}`
//         });
        
//         await inventoryItem.save();
//         updateLog.push(`Deducted ${amountToDeduct} ${inventoryItem.unit} of ${inventoryItem.itemName} (${inventoryItem.brand})`);
//       }
//     }
    
//     res.status(200).json({
//       success: true,
//       message: "Bar inventory updated successfully",
//       details: updateLog
//     });
//   } catch (error) {
//     console.error("Error updating bar inventory:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update bar inventory",
//       error: error.message
//     });
//   }
// };
// Updated deductFromBarOrder function for controllers/BarInventoryController.js

export const deductFromBarOrder = async (req, res) => {
  try {
    const { orderItems } = req.body;
    
    if (!orderItems || !Array.isArray(orderItems)) {
      return res.status(400).json({
        success: false,
        message: "Order items are required"
      });
    }
    
    const updateLog = [];
    const lowStockItems = [];
    const inventoryChanges = [];
    
    // Process each item in the order
    for (const item of orderItems) {
      // Find the recipe based on item name and measure (if applicable)
      const recipe = await BarRecipeModel.findOne({ 
        menuItemName: { $regex: new RegExp(`^${item.name}$`, 'i') },
        ...(item.measure ? { measure: item.measure } : {})
      });
      
      if (!recipe) {
        updateLog.push(`No recipe found for item: ${item.name} ${item.measure || ''}`);
        continue;
      }
      
      // Process each ingredient in the recipe
      for (const ingredient of recipe.ingredients) {
        // Calculate amount to deduct (recipe amount * order quantity)
        const amountToDeduct = ingredient.amount * item.quantity;
        
        // Find the inventory item
        const inventoryItem = await BarInventoryModel.findById(ingredient.inventoryItemId);
        
        if (!inventoryItem) {
          updateLog.push(`Inventory item not found: ${ingredient.inventoryItemId}`);
          continue;
        }
        
        // Check if we have enough stock
        if (inventoryItem.stockQuantity < amountToDeduct) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock of ${inventoryItem.itemName}. Need ${amountToDeduct} ${inventoryItem.unit} but only ${inventoryItem.stockQuantity} available.`
          });
        }
        
        // Store original values for response
        const originalQuantity = inventoryItem.stockQuantity;
        
        // Update inventory
        inventoryItem.stockQuantity -= amountToDeduct;
        inventoryItem.lastStockUpdate = new Date();
        
        // Calculate remaining pegs (if unit is ml)
        let remainingPegs = null;
        if (inventoryItem.unit === 'ml') {
          const standardPegSize = 30; // Standard peg size in ml
          remainingPegs = Math.floor(inventoryItem.stockQuantity / standardPegSize);
        }
        
        // Add to usage logs
        inventoryItem.usageLogs.push({
          date: new Date(),
          quantityUsed: amountToDeduct,
          purpose: `Bar order: ${item.name} ${item.measure || ''} x${item.quantity}`
        });
        
        // Update status based on remaining quantity
        if (inventoryItem.stockQuantity <= 0) {
          inventoryItem.status = "Out of Stock";
          lowStockItems.push(`${inventoryItem.itemName} (Out of Stock)`);
        } else if (inventoryItem.stockQuantity < inventoryItem.minStockThreshold) {
          inventoryItem.status = "Low Stock";
          lowStockItems.push(`${inventoryItem.itemName} (Low Stock: ${inventoryItem.stockQuantity} ${inventoryItem.unit})`);
        } else {
          inventoryItem.status = "Available";
        }
        
        // Save the updated inventory
        await inventoryItem.save();
        
        // Track all changes for reporting
        inventoryChanges.push({
          item: inventoryItem.itemName,
          brand: inventoryItem.brand,
          originalQuantity: originalQuantity,
          deducted: amountToDeduct,
          remaining: inventoryItem.stockQuantity,
          unit: inventoryItem.unit,
          remainingPegs: remainingPegs,
          status: inventoryItem.status,
          lastUpdated: inventoryItem.lastStockUpdate
        });
        
        updateLog.push(`Deducted ${amountToDeduct} ${inventoryItem.unit} of ${inventoryItem.itemName} (${inventoryItem.brand}). Remaining: ${inventoryItem.stockQuantity} ${inventoryItem.unit}${remainingPegs ? ` (approx. ${remainingPegs} standard pegs)` : ''}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: "Bar inventory updated successfully",
      details: updateLog,
      changes: inventoryChanges,
      lowStockItems: lowStockItems.length > 0 ? lowStockItems : null
    });
  } catch (error) {
    console.error("Error updating bar inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update bar inventory",
      error: error.message
    });
  }
};