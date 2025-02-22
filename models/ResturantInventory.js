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

const InventoryItem = mongoose.model(
  "RestaurantInventory",
  InventoryItemSchema
);
export default InventoryItem;
