import GeneralInventory, { GeneralCategory } from '../models/GeneralInventory.js';

export const getAllItems = async (req, res) => {
  try {
    const items = await GeneralInventory.find().populate('category', 'name');
    res.json({ success: true, data: items });
  } catch (error) {
    console.log("Error fetching inventory items:", error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await GeneralCategory.find();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.log("Error fetching categories:", error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const category = await GeneralCategory.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.log("Error creating category:", error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const createItem = async (req, res) => {
  try {
    const item = await GeneralInventory.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.log("Error creating inventory item:", error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await GeneralInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    console.log("Error updating inventory item:", error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await GeneralInventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    console.log("Error deleting inventory item:", error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};