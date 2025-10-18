import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Food', 'Beverage', 'Sports', 'Maintenance', 'Other'], default: 'Other' },
  unit: { type: String, required: true },
  standardPrice: { type: Number, default: 0 },
  preferredSuppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
  minReorderLevel: { type: Number, default: 0 },
  inventoryModel: { type: String, enum: ['BarInventory', 'RestaurantInventory', 'GeneralInventory'], required: false },
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, required: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);










