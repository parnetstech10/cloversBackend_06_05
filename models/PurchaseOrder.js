import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  itemModel: { type: String, enum: ['BarInventory', 'RestaurantInventory', 'GeneralInventory'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: false },
  itemName: { type: String, required: true },
  unit: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  poNumber: { type: String, unique: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Sent', 'Partially Received', 'Received', 'Closed', 'Cancelled', 'Draft', 'Placed'], default: 'Pending' },
  approvalHistory: [{ approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: String, date: Date, action: { type: String, enum: ['Approved', 'Rejected', 'Modified'] }, remarks: String }],
  items: [purchaseOrderItemSchema],
  expectedDeliveryDate: { type: Date },
  subtotal: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: { type: String },
  placedAt: { type: Date },
  sentAt: { type: Date },
  receivedAt: { type: Date },
  paymentStatus: { type: String, enum: ['Unpaid', 'Partially Paid', 'Paid'], default: 'Unpaid' }
}, { timestamps: true });

purchaseOrderSchema.pre('save', function(next) {
  const subtotal = this.items.reduce((sum, it) => sum + (it.total ?? (it.quantity * it.pricePerUnit)), 0);
  this.subtotal = subtotal;
  this.grandTotal = subtotal + (this.taxes || 0);
  if (!this.poNumber) {
    this.poNumber = `PO-${Date.now()}`;
  }
  next();
});

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);



