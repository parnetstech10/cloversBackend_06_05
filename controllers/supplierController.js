import Supplier from '../models/Supplier.js';

export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const listSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: supplier });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: supplier });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: {} });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};



