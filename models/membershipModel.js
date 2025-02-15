// models/membershipModel.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const membershipSchema = new Schema({
  // name: { type: String },
  description: { type: String },
  benefits: [String],
  price: { type: Number, required: true },
  membershipday: {
    type: Number,
    default: 0,
  },
  age: {
    type: String,
  },
  type: { type: String },

  createdAt: { type: Date, default: Date.now },
});

export default model("Membership", membershipSchema);
