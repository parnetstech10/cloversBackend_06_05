import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import BarInventory from '../models/BarInventoryModel.js';
import RestaurantInventory from '../models/ResturantInventory.js';
import GeneralInventory from '../models/GeneralInventory.js';
import Product from '../models/Product.js';

const resolveItemModel = (modelName) => {
  if (modelName === 'BarInventory') return BarInventory;
  if (modelName === 'RestaurantInventory') return RestaurantInventory;
  if (modelName === 'GeneralInventory') return GeneralInventory;
  return null;
}

export const createPO = async (req, res) => {
  try {
    const { supplier, items, status, expectedDeliveryDate, taxes, notes } = req.body;
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) return res.status(400).json({ success: false, message: 'Invalid supplier' });

    // If items reference Product IDs, expand from product master
    const normalizedItems = [];
    for (const it of (items || [])) {
      if (it.productId) {
        const p = await Product.findById(it.productId).populate('preferredSuppliers');
        if (!p) return res.status(400).json({ success: false, message: 'Invalid product in items' });
        // If supplier not provided, optionally assert supplier in preferredSuppliers
        const pricePerUnit = it.pricePerUnit != null ? Number(it.pricePerUnit) : Number(p.standardPrice || 0);
        // Route to correct inventory model based on product category
        const itemModel = (p.category === 'Beverage') ? 'BarInventory' : (p.category === 'Food' ? 'RestaurantInventory' : 'GeneralInventory');
        normalizedItems.push({
          itemModel,
          itemId: p.inventoryItemId || undefined,
          itemName: p.name,
          unit: p.unit,
          quantity: Number(it.quantity || 0),
          pricePerUnit,
          total: Number(it.quantity || 0) * pricePerUnit
        });
      } else {
        normalizedItems.push({
          itemModel: it.itemModel,
          itemId: it.itemId,
          itemName: it.itemName,
          unit: it.unit,
          quantity: Number(it.quantity || 0),
          pricePerUnit: Number(it.pricePerUnit || 0),
          total: Number(it.total ?? (Number(it.quantity || 0) * Number(it.pricePerUnit || 0)))
        });
      }
    }

    const po = await PurchaseOrder.create({ 
      supplier, 
      items: normalizedItems, 
      status: status || 'Pending', 
      expectedDeliveryDate, 
      taxes, 
      notes, 
      placedAt: req.body.placedAt ? new Date(req.body.placedAt) : new Date() // Always set placedAt when creating PO
    });
    res.status(201).json({ success: true, data: po });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const listPOs = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find().populate('supplier');
    res.json({ success: true, data: pos });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('supplier');
    if (!po) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: po });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const updatePO = async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.items)) {
      body.items = body.items.map(it => ({
        itemModel: it.itemModel,
        itemId: it.itemId,
        itemName: it.itemName,
        unit: it.unit,
        quantity: Number(it.quantity || 0),
        pricePerUnit: Number(it.pricePerUnit || 0),
        total: Number(it.total ?? (Number(it.quantity || 0) * Number(it.pricePerUnit || 0)))
      }));
    }
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!po) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: po });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const deletePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: {} });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// Receive a PO: increments stock for each item and marks received
export const receivePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Not found' });
    if (po.status === 'Received') return res.status(400).json({ success: false, message: 'PO already received' });

    for (const it of po.items) {
      const Model = resolveItemModel(it.itemModel);
      if (!Model) continue;
      const doc = await Model.findById(it.itemId);
      if (!doc) continue;

      if (it.itemModel === 'GeneralInventory') {
        doc.quantity = (doc.quantity || 0) + it.quantity;
      } else {
        doc.stockQuantity = (doc.stockQuantity || 0) + it.quantity;
        if (doc.purchaseHistory) {
          doc.purchaseHistory.push({ date: new Date(), quantityPurchased: it.quantity, pricePerUnit: it.pricePerUnit, totalCost: it.total });
        }
      }
      await doc.save();
    }

    po.status = 'Received';
    po.receivedAt = new Date();
    await po.save();
    res.json({ success: true, data: po });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const lowStockAlerts = async (req, res) => {
  try {
    const barLow = await BarInventory.find({ $or: [ { status: 'Low Stock' }, { status: 'Out of Stock' } ] });
    const restLow = await RestaurantInventory.find({ $or: [ { status: 'Low Stock' }, { status: 'Out of Stock' } ] });
    const genLow = await GeneralInventory.find({ $or: [ { status: 'Low Stock' }, { status: 'Out of Stock' } ] });
    res.json({ success: true, data: { bar: barLow, restaurant: restLow, general: genLow } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export const approvePO = async (req, res) => {
  try {
    const { action, remarks, approvedBy, role } = req.body; // action: 'Approved' | 'Rejected'
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'Not found' });
    po.approvalHistory = po.approvalHistory || [];
    po.approvalHistory.push({ approvedBy, role, date: new Date(), action, remarks });
    if (action === 'Approved') {
      po.status = 'Approved';
    } else if (action === 'Rejected') {
      po.status = 'Cancelled';
    }
    await po.save();
    res.json({ success: true, data: po });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const sendPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('supplier');
    if (!po) return res.status(404).json({ success: false, message: 'Not found' });
    if (!['Approved', 'Placed', 'Pending'].includes(po.status)) return res.status(400).json({ success: false, message: 'PO not ready to send' });
    po.status = 'Sent';
    po.sentAt = new Date();
    await po.save();
    // TODO: integrate email dispatch to supplier.email
    res.json({ success: true, data: po });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};




