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
  description: { type: String }
}, { timestamps: true });

export const GeneralCategory = mongoose.model('GeneralCategory', generalCategorySchema);
export default mongoose.model('GeneralInventory', generalInventorySchema);