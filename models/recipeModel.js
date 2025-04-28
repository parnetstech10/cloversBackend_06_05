// models/recipeModel.js
import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  menuItemName: {
    type: String,
    required: true,
    unique: true
  },
  ingredients: [{
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantInventory',
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

const RecipeModel = mongoose.model('Recipe', recipeSchema);

export default RecipeModel;