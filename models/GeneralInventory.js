import mongoose from 'mongoose';

const generalCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

const generalInventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GeneralCategory', 
    required: true 
  },
  quantity: { type: Number, default: 0 },
  unit: { type: String, required: true },
  description: { type: String },
  minStockThreshold: { type: Number, default: 0 },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  lastStockUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

// Keep status in sync with quantity and threshold
generalInventorySchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity < this.minStockThreshold) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }

  if (this.isModified('quantity')) {
    this.lastStockUpdate = new Date();
  }
  next();
});

generalInventorySchema.statics.findLowStockItems = function() {
  return this.find({ status: { $in: ['Low Stock', 'Out of Stock'] } });
}

export const GeneralCategory = mongoose.model('GeneralCategory', generalCategorySchema);
export default mongoose.model('GeneralInventory', generalInventorySchema);