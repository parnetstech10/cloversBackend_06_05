import mongoose from 'mongoose';

const restaurantInventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true }, // e.g., Vegetables, Dairy, Meat, Spices, Beverages
  brand: { type: String, trim: true }, // Optional brand name
  volume: { type: Number, min: 0 }, // Quantity in specific units
  unit: { type: String, enum: ['kg', 'g', 'L', 'ml', 'pcs'], required: true }, // Measurement units
  pricePerUnit: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 }, // Current stock level
  minStockThreshold: { type: Number, required: true, min: 0, default: 5 }, // Alert level for low stock
  supplier: { 
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  purchaseHistory: [
    {
      date: { type: Date, default: Date.now },
      quantityPurchased: { type: Number, required: true, min: 0 },
      pricePerUnit: { type: Number, required: true, min: 0 },
      totalCost: { type: Number, required: true, min: 0 },
      supplier: { type: String, required: true, trim: true }
    }
  ],
  usageLogs: [
    {
      date: { type: Date, default: Date.now },
      quantityUsed: { type: Number, required: true, min: 0 },
      purpose: { type: String, enum: ["Cooking", "Wastage", "Sale", "Other"], default: "Cooking" }
    }
  ],
  lastStockUpdate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['Available', 'Low Stock', 'Out of Stock'], 
    default: 'Available' 
  }
});

// Middleware to update stock status before saving
restaurantInventorySchema.pre('save', function (next) {
  if (this.stockQuantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.stockQuantity < this.minStockThreshold) {
    this.status = 'Low Stock';
  } else {
    this.status = 'Available';
  }
  this.lastStockUpdate = new Date();
  next();
});

const RestaurantInventory = mongoose.model('RestaurantInventory', restaurantInventorySchema);

export default RestaurantInventory;
