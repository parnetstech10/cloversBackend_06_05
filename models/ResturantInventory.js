import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema({
  name: String,
  contact: String,
  email: String,
  address: String,
});

const PurchaseHistorySchema = new mongoose.Schema({
  date: Date,
  quantityPurchased: Number,
  pricePerUnit: Number,
  totalCost: Number,
});

const UsageLogSchema = new mongoose.Schema({
  date: Date,
  quantityUsed: Number,
  purpose: String,
});

const InventoryItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  brand: String,
  volume: Number,
  unit: String,
  pricePerUnit: Number,
  stockQuantity: { type: Number, required: true },
  minStockThreshold: Number,
  supplier: SupplierSchema,
  lastStockUpdate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["In Stock", "Out of Stock", "Low Stock"],
    default: "In Stock",
  },
  purchaseHistory: [PurchaseHistorySchema],
  usageLogs: [UsageLogSchema],
});

// Pre-save middleware to automatically update status and timestamps
InventoryItemSchema.pre('save', function(next) {
  // Update status based on stock quantity
  if (this.stockQuantity <= 0) {
    this.status = "Out of Stock";
  } else if (this.stockQuantity < this.minStockThreshold) {
    this.status = "Low Stock";
  } else {
    this.status = "In Stock";
  }
  
  // Update lastStockUpdate timestamp whenever stock changes
  if (this.isModified('stockQuantity')) {
    this.lastStockUpdate = new Date();
  }
  
  next();
});

// Add these static methods to InventoryItemSchema before creating the model

// Static method to find all low stock items
InventoryItemSchema.statics.findLowStockItems = function() {
  return this.find({ status: "Low Stock" });
};

// Static method to find all out of stock items
InventoryItemSchema.statics.findOutOfStockItems = function() {
  return this.find({ status: "Out of Stock" });
};

// Static method to update stock with purchase
InventoryItemSchema.statics.addPurchase = async function(itemId, quantity, pricePerUnit, totalCost) {
  const item = await this.findById(itemId);
  if (!item) throw new Error('Inventory item not found');
  
  // Calculate total if not provided
  const calculatedTotal = totalCost || (quantity * pricePerUnit);
  
  // Add to purchase history
  item.purchaseHistory.push({
    date: new Date(),
    quantityPurchased: quantity,
    pricePerUnit: pricePerUnit,
    totalCost: calculatedTotal
  });
  
  // Update stock quantity
  item.stockQuantity += quantity;
  
  // Save item (middleware will update status and timestamp)
  return item.save();
};

const InventoryItem = mongoose.model(
  "RestaurantInventory",
  InventoryItemSchema
);
export default InventoryItem;
