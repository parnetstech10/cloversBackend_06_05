import mongoose from "mongoose";

const barInventorySchema = new mongoose.Schema({
  itemName: { type: String, trim: true },
  category: {
    type: String,
    enum: ["Liquor", "Beer", "Wine", "Mixer", "Other"],
    required: true,
  },
  brand: { type: String },
  volume: { type: Number, min: 0 }, // In milliliters (ml)
  unit: { type: String, enum: ["ml", "liters", "bottles"], default: "ml" }, // Unit type
  pricePerUnit: { type: Number, min: 0 },
  stockQuantity: { type: Number, min: 0 }, // Current stock level
  minStockThreshold: { type: Number, min: 0 }, // Alert for low stock

  supplierName: { type: String },
  supplierContact: { type: String },
  supplierEmail: { type: String },
  supplierAddress: { type: String },

  lastStockUpdate: { type: Date, default: Date.now },
  purchaseHistory: [
    {
      date: { type: Date, default: Date.now },
      quantityAdded: { type: Number, min: 0 },
      cost: { type: Number, min: 0 },
    },
  ],
  usageLogs: [
    {
      date: { type: Date, default: Date.now },
      quantityUsed: { type: Number, min: 0 },
      purpose: {
        type: String,
        enum: ["Sale", "Breakage", "Spillage", "Other"],
        default: "Sale",
      },
    },
  ],
  status: {
    type: String,
    enum: ["Available", "Out of Stock", "Low Stock"],
    default: "Available",
  },
});

// Middleware to update stock status
barInventorySchema.pre("save", function (next) {
  // Update lastStockUpdate when stock changes
  if (this.isModified('stockQuantity')) {
    this.lastStockUpdate = new Date();
  }
  
  // Update status based on stock level
  if (this.stockQuantity <= 0) {
    this.status = "Out of Stock";
  } else if (this.stockQuantity < this.minStockThreshold) {
    this.status = "Low Stock";
  } else {
    this.status = "Available";
  }
  
  next();
});

const BarInventoryModel = mongoose.model("BarInventory", barInventorySchema);

export default BarInventoryModel;
