import mongoose from "mongoose";

const barRecipeSchema = new mongoose.Schema({
  menuItemName: { 
    type: String, 
    required: true 
  },
  measure: { 
    type: String,
    default: '' // For drinks that have different measures (30ml, 60ml, etc.)
  },
  ingredients: [{
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BarInventory',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true
    }
  }]
}, { timestamps: true });

// Create a compound index for menuItemName + measure
barRecipeSchema.index({ menuItemName: 1, measure: 1 }, { unique: true });

const BarRecipeModel = mongoose.model('BarRecipe', barRecipeSchema);

export default BarRecipeModel;
