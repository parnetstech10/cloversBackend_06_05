import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String },
  itemModel: { type: String, enum: ['BarInventory', 'RestaurantInventory', 'GeneralInventory'], required: false },
  itemId: { type: mongoose.Schema.Types.ObjectId },
  itemName: { type: String },
  unit: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  pricePerUnit: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const supplierInvoiceSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  grn: { type: mongoose.Schema.Types.ObjectId, ref: 'GRN' },
  invoiceNumber: { type: String, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Issued', 'Paid', 'Cancelled'], default: 'Issued' },
  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Unpaid', 'Partially Paid', 'Paid'], default: 'Unpaid' },
  payments: [{ amount: Number, date: { type: Date, default: Date.now }, method: String }]
}, { timestamps: true });

supplierInvoiceSchema.pre('save', function(next) {
  const subtotal = this.items.reduce((s, it) => s + (it.total ?? (it.quantity * it.pricePerUnit)), 0);
  this.subtotal = subtotal;
  this.grandTotal = subtotal + (this.taxes || 0);
  if (!this.invoiceNumber) this.invoiceNumber = `INV-${Date.now()}`;
  next();
});

export default mongoose.model('SupplierInvoice', supplierInvoiceSchema);













