import mongoose from "mongoose";

// Inventory Log Schema for audit trail
const InventoryLogSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  grnId: { type: mongoose.Schema.Types.ObjectId, ref: 'GRN' },
  type: { type: String, enum: ['Bar', 'Restaurant', 'General'], required: true },
  previousQty: { type: Number, required: true },
  receivedQty: { type: Number, default: 0 },
  damagedQty: { type: Number, default: 0 },
  adjustedQty: { type: Number, required: true },
  newQty: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  notes: String,
  adjustedBy: String,
  reference: String, // PO Number, GRN Number, etc.
}, { timestamps: true });

// Main Inventory Schema
const InventorySchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Reference to Product Master
  itemName: { type: String, required: true },
  category: { type: String, enum: ['Bar', 'Restaurant', 'General'], required: true },
  unit: { type: String, required: true },
  currentStock: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, required: true, min: 0 },
  lastReceivedDate: { type: Date },
  lastReceivedQty: { type: Number, default: 0 },
  supplier: { type: String, required: true },
  location: String, // shelf/bin reference
  costPerUnit: { type: Number, required: true, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
  status: { 
    type: String, 
    enum: ['In Stock', 'Low Stock', 'Out of Stock'], 
    default: 'In Stock' 
  },
}, { timestamps: true });

// Pre-save middleware to update status and total value
InventorySchema.pre('save', function(next) {
  // Update status based on current stock
  if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  
  // Update total value
  this.totalValue = this.currentStock * this.costPerUnit;
  
  next();
});

// Static methods
InventorySchema.statics.findLowStockItems = function() {
  return this.find({ 
    $or: [
      { currentStock: 0 },
      { currentStock: { $lte: '$reorderLevel' } }
    ]
  });
};

InventorySchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

InventorySchema.statics.updateStockFromGRN = async function(grnItems, grnId) {
  const updates = [];
  
  for (const item of grnItems) {
    const adjustedQty = item.receivedQty - (item.damagedQty || 0);
    
    // Find or create inventory record
    let inventory = await this.findOne({ 
      itemId: item.itemId, 
      category: item.itemModel 
    });
    
    if (!inventory) {
      // Create new inventory record
      inventory = new this({
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.itemModel,
        unit: item.unit,
        currentStock: adjustedQty,
        reorderLevel: item.reorderLevel || 10,
        lastReceivedDate: new Date(),
        lastReceivedQty: item.receivedQty,
        supplier: item.supplier,
        costPerUnit: item.pricePerUnit,
        totalValue: adjustedQty * item.pricePerUnit
      });
    } else {
      // Update existing inventory
      const previousQty = inventory.currentStock;
      inventory.currentStock += adjustedQty;
      inventory.lastReceivedDate = new Date();
      inventory.lastReceivedQty = item.receivedQty;
      inventory.supplier = item.supplier;
      inventory.costPerUnit = item.pricePerUnit;
      inventory.totalValue = inventory.currentStock * item.pricePerUnit;
      
      // Create audit log
      await InventoryLog.create({
        inventoryId: inventory._id,
        grnId: grnId,
        type: item.itemModel,
        previousQty: previousQty,
        receivedQty: item.receivedQty,
        damagedQty: item.damagedQty || 0,
        adjustedQty: adjustedQty,
        newQty: inventory.currentStock,
        notes: `GRN Receipt - ${item.itemName}`,
        reference: `GRN-${grnId.toString().slice(-6)}`
      });
    }
    
    updates.push(inventory.save());
  }
  
  return Promise.all(updates);
};

InventorySchema.statics.adjustStock = async function(inventoryId, adjustmentData) {
  const inventory = await this.findById(inventoryId);
  if (!inventory) throw new Error('Inventory item not found');
  
  const previousQty = inventory.currentStock;
  const newQty = previousQty + adjustmentData.quantityChange;
  
  if (newQty < 0) throw new Error('Stock cannot be negative');
  
  inventory.currentStock = newQty;
  inventory.totalValue = newQty * inventory.costPerUnit;
  
  // Create audit log
  await InventoryLog.create({
    inventoryId: inventory._id,
    type: inventory.category,
    previousQty: previousQty,
    adjustedQty: adjustmentData.quantityChange,
    newQty: newQty,
    notes: adjustmentData.reason,
    adjustedBy: adjustmentData.adjustedBy,
    reference: adjustmentData.reference
  });
  
  return inventory.save();
};

// Create models
const Inventory = mongoose.model('Inventory', InventorySchema);
const InventoryLog = mongoose.model('InventoryLog', InventoryLogSchema);

export { Inventory, InventoryLog };
export default Inventory;




