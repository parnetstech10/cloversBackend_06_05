import mongoose from 'mongoose';

// Measures schema for multi-measure items
const measureSchema = new mongoose.Schema({
  measure: { type: String, required: true }, // e.g., "30ml", "60ml", "Full Bottle"
  price: { type: Number, required: true },   // price for that specific measure
});

// Item schema to handle both a single price AND optional measures
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number }, // optional if using measures array
  measures: [measureSchema], // optional array of measure objects
  description: { type: String , required:true},
  // image: { type: String },
});

const menuSchema = new mongoose.Schema({
  category: { type: String, required: true },
  subCategories: [
    {
      name: { type: String, required: true },
      items: [itemSchema],
    },
  ],
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
