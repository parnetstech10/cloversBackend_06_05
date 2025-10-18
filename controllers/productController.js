import Product from '../models/Product.js';

export const listProducts = async (req, res) => {
  try {
    const list = await Product.find().populate('preferredSuppliers');
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json({ success: true, data: p });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('preferredSuppliers');
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: p });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: p });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: {} });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};








