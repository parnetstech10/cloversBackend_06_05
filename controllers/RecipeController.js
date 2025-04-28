import RecipeModel from '../models/recipeModel.js';
import RestaurantInventoryModel from '../models/ResturantInventory.js';
import mongoose from 'mongoose';

export const addRecipe = async (req, res) => {
  try {
    const { menuItemName, ingredients } = req.body;
    
    // Check if recipe already exists
    const existingRecipe = await RecipeModel.findOne({ menuItemName });
    if (existingRecipe) {
      return res.status(400).json({
        success: false,
        message: "Recipe already exists for this menu item"
      });
    }
    
    // Create new recipe
    const newRecipe = new RecipeModel({
      menuItemName,
      ingredients
    });
    
    await newRecipe.save();
    
    res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      data: newRecipe
    });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create recipe",
      error: error.message
    });
  }
};

export const getRecipes = async (req, res) => {
  try {
    const recipes = await RecipeModel.find()
      .populate('ingredients.inventoryItemId', 'itemName unit');
    
    res.status(200).json({
      success: true,
      count: recipes.length,
      data: recipes
    });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recipes",
      error: error.message
    });
  }
};

export const getRecipeByMenuItemName = async (req, res) => {
  try {
    const { menuItemName } = req.params;
    
    const recipe = await RecipeModel.findOne({ 
      menuItemName: { $regex: new RegExp(`^${menuItemName}$`, 'i') } 
    }).populate('ingredients.inventoryItemId', 'itemName unit');
    
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recipe",
      error: error.message
    });
  }
};

export const deductFromOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderItems } = req.body;
    
    if (!orderItems || !Array.isArray(orderItems)) {
      return res.status(400).json({ 
        success: false, 
        message: "Order items are required" 
      });
    }
    
    const inventoryChanges = [];
    const missingRecipes = [];
    
    // Process each item in the order
    for (const item of orderItems) {
      // Get the recipe for this menu item
      const recipe = await RecipeModel.findOne({ 
        menuItemName: { $regex: new RegExp(`^${item.name}$`, 'i') } 
      });
      
      // If no recipe found, record and skip this item
      if (!recipe) {
        missingRecipes.push(item.name);
        continue;
      }
      
      // Process each ingredient in the recipe
      for (const ingredient of recipe.ingredients) {
        // Calculate the amount to deduct (recipe amount * quantity ordered)
        const amountToDeduct = ingredient.amount * item.quantity;
        
        // Find the inventory item
        const inventoryItem = await RestaurantInventoryModel.findById(
          ingredient.inventoryItemId
        ).session(session);
        
        if (!inventoryItem) {
          console.log(`Inventory item not found: ${ingredient.inventoryItemId}`);
          continue;
        }
        
        // Check if we have enough stock
        if (inventoryItem.stockQuantity < amountToDeduct) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock of ${inventoryItem.itemName}. Need ${amountToDeduct} ${inventoryItem.unit} but only ${inventoryItem.stockQuantity} available.`
          });
        }
        
        // Update the inventory
        inventoryItem.stockQuantity -= amountToDeduct;
        inventoryItem.lastStockUpdate = new Date();
        
        // Update status based on remaining quantity
        if (inventoryItem.stockQuantity <= 0) {
          inventoryItem.status = "Out of Stock";
        } else if (inventoryItem.stockQuantity < inventoryItem.minStockThreshold) {
          inventoryItem.status = "Low Stock";
        } else {
          inventoryItem.status = "In Stock";
        }
        
        // Add to usage logs
        inventoryItem.usageLogs.push({
          date: new Date(),
          quantityUsed: amountToDeduct,
          purpose: `Order item: ${item.name} x${item.quantity}`
        });
        
        // Save the updated inventory
        await inventoryItem.save({ session });
        
        // Track changes
        inventoryChanges.push({
          item: inventoryItem.itemName,
          deducted: amountToDeduct,
          unit: inventoryItem.unit,
          remaining: inventoryItem.stockQuantity,
          status: inventoryItem.status
        });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      changes: inventoryChanges,
      missingRecipes: missingRecipes.length > 0 ? missingRecipes : null
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update inventory",
      error: error.message
    });
  }
};

// Get all low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const lowStockItems = await RestaurantInventoryModel.findLowStockItems();
    
    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock items",
      error: error.message
    });
  }
};

// Add inventory purchase
export const addInventoryPurchase = async (req, res) => {
  try {
    const { itemId, quantity, pricePerUnit, totalCost } = req.body;
    
    if (!itemId || !quantity || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: "Item ID, quantity, and price per unit are required"
      });
    }
    
    const updatedItem = await RestaurantInventoryModel.addPurchase(
      itemId, 
      Number(quantity), 
      Number(pricePerUnit), 
      totalCost ? Number(totalCost) : undefined
    );
    
    res.status(200).json({
      success: true,
      message: "Purchase added successfully",
      data: updatedItem
    });
  } catch (error) {
    console.error("Error adding purchase:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add purchase",
      error: error.message
    });
  }
};

// Get inventory usage history
export const getInventoryUsageHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await RestaurantInventoryModel.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found"
      });
    }
    
    res.status(200).json({
      success: true,
      itemName: item.itemName,
      usageLogs: item.usageLogs
    });
  } catch (error) {
    console.error("Error fetching usage history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch usage history",
      error: error.message
    });
  }
};