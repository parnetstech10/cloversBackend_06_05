import GRN from '../models/GRN.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Supplier from '../models/Supplier.js';
import Inventory, { InventoryLog } from '../models/Inventory.js';

export const createGRN = async (req, res) => {
  try {
    const { supplier, purchaseOrder, items, taxes } = req.body;
    const sup = await Supplier.findById(supplier);
    if (!sup) return res.status(400).json({ success: false, message: 'Invalid supplier' });
    const po = await PurchaseOrder.findById(purchaseOrder);
    if (!po) return res.status(400).json({ success: false, message: 'Invalid purchase order' });

    // Validate against PO quantities cumulatively (allow partial receipts)
    const poItemsMap = new Map();
    if (po && Array.isArray(po.items)) {
      for (const pit of po.items) {
        poItemsMap.set(`${pit.itemModel}:${pit.itemId || pit.itemName}`, Number(pit.quantity || 0));
      }
    }

    // Sum prior receipts for this PO
    const priorGRNs = await GRN.find({ purchaseOrder }).lean();
    const priorReceivedMap = new Map();
    for (const g of priorGRNs) {
      for (const it of (g.items || [])) {
        const key = `${it.itemModel}:${it.itemId || it.itemName}`;
        priorReceivedMap.set(key, (priorReceivedMap.get(key) || 0) + Number(it.receivedQty || 0));
      }
    }

    for (const it of items) {
      const key = `${it.itemModel}:${it.itemId || it.itemName}`;
      const ordered = poItemsMap.get(key);
      if (ordered != null) {
        const already = priorReceivedMap.get(key) || 0;
        const receivedQty = Number(it.receivedQty || 0);
        if (already + receivedQty > ordered) {
          return res.status(400).json({ success: false, message: `Received qty exceeds ordered for ${it.itemName}. Ordered: ${ordered}, Already received: ${already}, Now: ${receivedQty}` });
        }
      }
    }

    // Update stocks using new unified inventory system
    const grnTimestamp = Date.now();
    console.log('Processing GRN items:', items);
    
    for (const it of items) {
      const receivedQty = Number(it.receivedQty || 0);
      const damagedQty = Number(it.damagedQty || 0);
      const netQty = Math.max(receivedQty - damagedQty, 0);

      // Determine category based on itemModel
      let category = 'General';
      if (it.itemModel === 'BarInventory') category = 'Bar';
      else if (it.itemModel === 'RestaurantInventory') category = 'Restaurant';
      
      console.log(`Processing item: ${it.itemName}, Category: ${category}, Net Qty: ${netQty}`);
      
      // Find or create inventory item
      let inventoryItem = null;
      
      if (it.itemId && String(it.itemId) !== '000000000000000000000000') {
        // Try to find existing inventory item by itemId
        inventoryItem = await Inventory.findOne({ 
          itemId: it.itemId, 
          category: category 
        });
      }
      
      if (!inventoryItem) {
        // Try to find by itemName and category
        inventoryItem = await Inventory.findOne({ 
          itemName: it.itemName, 
          category: category 
        });
      }
      
      if (!inventoryItem) {
        // Create new inventory item
        console.log(`Creating new inventory item: ${it.itemName} in ${category} category`);
        try {
          inventoryItem = await Inventory.create({
            itemName: it.itemName,
            category: category,
            unit: it.unit || 'pcs',
            currentStock: 0,
            reorderLevel: 10, // Default reorder level
            supplier: sup.name,
            costPerUnit: it.pricePerUnit || 0,
            totalValue: 0
          });
          console.log(`Successfully created inventory item with ID: ${inventoryItem._id}`);
        } catch (createError) {
          console.error(`Error creating inventory item: ${createError.message}`);
          throw createError;
        }
      }
      
      // Update inventory with net quantity (received - damaged)
      const previousQty = inventoryItem.currentStock;
      inventoryItem.currentStock += netQty;
      inventoryItem.lastReceivedDate = new Date();
      inventoryItem.lastReceivedQty = receivedQty;
      inventoryItem.supplier = sup.name;
      inventoryItem.costPerUnit = it.pricePerUnit || inventoryItem.costPerUnit;
      inventoryItem.totalValue = inventoryItem.currentStock * inventoryItem.costPerUnit;
      
      console.log(`Updating inventory: ${it.itemName}, Previous: ${previousQty}, Adding: ${netQty}, New Total: ${inventoryItem.currentStock}`);
      try {
        await inventoryItem.save();
        console.log(`Successfully saved inventory item: ${it.itemName}`);
      } catch (saveError) {
        console.error(`Error saving inventory item: ${saveError.message}`);
        throw saveError;
      }
      
      // Create audit log entry
      await InventoryLog.create({
        inventoryId: inventoryItem._id,
        grnId: null, // Will be updated after GRN is created
        type: category,
        previousQty: previousQty,
        receivedQty: receivedQty,
        damagedQty: damagedQty,
        adjustedQty: netQty,
        newQty: inventoryItem.currentStock,
        notes: `GRN Receipt - ${it.itemName}. Received: ${receivedQty}, Damaged: ${damagedQty}, Net: ${netQty}`,
        reference: `GRN-${grnTimestamp}`
      });
    }

    const grn = await GRN.create({ supplier, purchaseOrder, items, taxes });
    
    // Update audit logs with GRN ID
    await InventoryLog.updateMany(
      { reference: `GRN-${grnTimestamp}` },
      { grnId: grn._id }
    );
    
    // Update PO status based on cumulative receipts
    // Recompute totals
    const newPrior = await GRN.find({ purchaseOrder }).lean();
    const receivedTotalMap = new Map();
    for (const g of newPrior) {
      for (const it of (g.items || [])) {
        const key = `${it.itemModel}:${it.itemId || it.itemName}`;
        receivedTotalMap.set(key, (receivedTotalMap.get(key) || 0) + Number(it.receivedQty || 0));
      }
    }
    let fullyReceived = true;
    for (const pit of po.items) {
      const key = `${pit.itemModel}:${pit.itemId || pit.itemName}`;
      const ordered = Number(pit.quantity || 0);
      const rec = Number(receivedTotalMap.get(key) || 0);
      if (rec < ordered) {
        fullyReceived = false;
        break;
      }
    }
    po.status = fullyReceived ? 'Received' : 'Partially Received';
    if (fullyReceived) po.receivedAt = new Date();
    await po.save();
    console.log('GRN created successfully:', grn._id);
    res.status(201).json({ success: true, data: grn });
  } catch (e) {
    console.error('Error creating GRN:', e);
    res.status(400).json({ success: false, message: e.message });
  }
};

export const listGRNs = async (req, res) => {
  try {
    const list = await GRN.find().populate('supplier').populate('purchaseOrder');
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getGRN = async (req, res) => {
  try {
    const grn = await GRN.findById(req.params.id).populate('supplier').populate('purchaseOrder');
    if (!grn) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: grn });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};



