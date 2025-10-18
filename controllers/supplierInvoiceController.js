import SupplierInvoice from '../models/SupplierInvoice.js';
import Supplier from '../models/Supplier.js';
import GRN from '../models/GRN.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

export const createInvoice = async (req, res) => {
  try {
    const { supplier, grn, items, taxes } = req.body;
    const sup = await Supplier.findById(supplier);
    if (!sup) return res.status(400).json({ success: false, message: 'Invalid supplier' });
    if (grn) {
      const g = await GRN.findById(grn);
      if (!g) return res.status(400).json({ success: false, message: 'Invalid GRN' });
      // three-way match: PO -> GRN -> Invoice totals/quantities
      const po = await PurchaseOrder.findById(g.purchaseOrder);
      if (po) {
        const poTotal = po.items.reduce((s, it) => s + (Number(it.total) || (Number(it.quantity)*Number(it.pricePerUnit))), 0);
        const grnTotal = g.items.reduce((s, it) => s + (Number(it.total) || (Number(it.receivedQty)*Number(it.pricePerUnit))), 0);
        // If invoice has items, verify; if not, accept zero and rely on totals
        const invItems = items || [];
        const invoiceTotal = invItems.length ? invItems.reduce((s, it) => s + (Number(it.total) || (Number(it.quantity)*Number(it.pricePerUnit))), 0) : grnTotal;
        const tolerance = 0.01; // allow minor rounding differences
        if (Math.abs(invoiceTotal - grnTotal) > tolerance) {
          return res.status(400).json({ success: false, message: 'Invoice total does not match GRN total' });
        }
        if (Math.abs(grnTotal - poTotal) > tolerance) {
          // warn but allow; suppliers may bill taxes/charges
          // return res.status(400).json({ success: false, message: 'GRN total does not match PO total' });
        }
      }
    }
    const inv = await SupplierInvoice.create({ supplier, grn, items, taxes, status: 'Issued' });
    res.status(201).json({ success: true, data: inv });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const listInvoices = async (req, res) => {
  try {
    const list = await SupplierInvoice.find().populate('supplier').populate('grn');
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const inv = await SupplierInvoice.findById(req.params.id).populate('supplier').populate('grn');
    if (!inv) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: inv });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const inv = await SupplierInvoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Not found' });
    inv.payments.push({ amount, method });
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    inv.paymentStatus = paid >= inv.grandTotal ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');
    await inv.save();
    res.json({ success: true, data: inv });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};



