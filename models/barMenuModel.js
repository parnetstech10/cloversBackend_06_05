import mongoose from "mongoose";

// Measures schema for multi-measure items
const measureBarSchema = new mongoose.Schema({
  measure: { type: String, required: true }, // e.g., "30ml", "60ml", "Full Bottle"
  price: { type: Number, required: true }, // price for that specific measure
});

// Item schema to handle both a single price AND optional measures
const itemBarSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number }, // optional if using measures array,
  description: { type: String },
  measures: [measureBarSchema], // optional array of measure objects
  image: { type: String },
});

const menuBarSchema = new mongoose.Schema({
  category: { type: String, required: true },
  brand: [
    {
      name: { type: String, required: true },
      items: [itemBarSchema],
    },
  ],
});

const MenuBar = mongoose.model("MenuBar", menuBarSchema);

export default MenuBar;
