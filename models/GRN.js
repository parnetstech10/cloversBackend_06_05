import mongoose from 'mongoose';

const grnItemSchema = new mongoose.Schema({
  itemModel: { type: String, enum: ['BarInventory', 'RestaurantInventory', 'GeneralInventory'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemName: { type: String, required: true },
  unit: { type: String },
  orderedQty: { type: Number, default: 0 },
  receivedQty: { type: Number, required: true, min: 0 },
  damagedQty: { type: Number, default: 0, min: 0 },
  netQty: { type: Number, default: 0 }, // Calculated field: receivedQty - damagedQty
  batchNumber: { type: String },
  expiryDate: { type: Date },
  location: { type: String },
  pricePerUnit: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

// Pre-save middleware to calculate netQty
grnItemSchema.pre('save', function(next) {
  this.netQty = Math.max((this.receivedQty || 0) - (this.damagedQty || 0), 0);
  next();
});

const grnSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  grnNumber: { type: String, unique: true },
  status: { type: String, enum: ['Draft', 'Received'], default: 'Received' },
  challanUrl: { type: String },
  items: [grnItemSchema],
  subtotal: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { timestamps: true });

grnSchema.pre('save', function(next) {
  // Calculate total based on net quantity (received - damaged)
  const subtotal = this.items.reduce((s, it) => {
    const netQty = Math.max((it.receivedQty || 0) - (it.damagedQty || 0), 0);
    return s + (it.total ?? (netQty * it.pricePerUnit));
  }, 0);
  this.subtotal = subtotal;
  this.grandTotal = subtotal + (this.taxes || 0);
  if (!this.grnNumber) {
    this.grnNumber = `GRN-${Date.now()}`;
  }
  next();
});

const GRN = mongoose.model('GRN', grnSchema);
export default GRN;

