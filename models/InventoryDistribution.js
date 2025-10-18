import mongoose from "mongoose";

// Inventory Distribution Schema
const InventoryDistributionSchema = new mongoose.Schema({
  // Distribution details
  distributionId: { 
    type: String, 
    unique: true,
    default: () => `DIST-${Date.now()}`
  },
  
  // Admin who made the distribution
  distributedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  distributedByName: { type: String, required: true },
  
  // Recipient details
  recipientType: { 
    type: String, 
    enum: ['Member', 'Staff', 'Department', 'Event', 'Other'], 
    required: true 
  },
  recipientId: { type: mongoose.Schema.Types.ObjectId }, // If member/staff
  recipientName: { type: String, required: true },
  recipientContact: String,
  
  // Distribution items
  items: [{
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    itemName: { type: String, required: true },
    category: { type: String, enum: ['Bar', 'Restaurant', 'General'], required: true },
    unit: { type: String, required: true },
    quantityDistributed: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true }
  }],
  
  // Distribution summary (calculated by pre-save middleware)
  totalItems: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  
  // Purpose and notes
  purpose: { type: String, required: true },
  notes: String,
  
  // Status and approval
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Completed', 'Cancelled'], 
    default: 'Pending' 
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId },
  approvedAt: Date,
  
  // Distribution date
  distributionDate: { type: Date, default: Date.now },
  
  // Location/Department
  department: String,
  location: String,
  
}, { timestamps: true });

// Pre-save middleware to calculate totals
InventoryDistributionSchema.pre('save', function(next) {
  console.log("Pre-save middleware - items:", this.items);
  console.log("Pre-save middleware - items length:", this.items?.length);
  
  if (this.items && this.items.length > 0) {
    this.totalItems = this.items.length;
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantityDistributed, 0);
    this.totalValue = this.items.reduce((sum, item) => sum + item.totalCost, 0);
    
    console.log("Pre-save middleware - calculated totals:", {
      totalItems: this.totalItems,
      totalQuantity: this.totalQuantity,
      totalValue: this.totalValue
    });
  }
  next();
});

// Static methods
InventoryDistributionSchema.statics.findByRecipient = function(recipientId) {
  return this.find({ recipientId }).sort({ distributionDate: -1 });
};

InventoryDistributionSchema.statics.findByAdmin = function(adminId) {
  return this.find({ distributedBy: adminId }).sort({ distributionDate: -1 });
};

InventoryDistributionSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    distributionDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ distributionDate: -1 });
};

InventoryDistributionSchema.statics.getDistributionStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalDistributions: { $sum: 1 },
        totalValue: { $sum: '$totalValue' },
        totalQuantity: { $sum: '$totalQuantity' },
        avgValuePerDistribution: { $avg: '$totalValue' }
      }
    }
  ]);

  const categoryStats = await this.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        totalDistributed: { $sum: '$items.quantityDistributed' },
        totalValue: { $sum: '$items.totalCost' },
        distributions: { $sum: 1 }
      }
    }
  ]);

  const monthlyStats = await this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$distributionDate' },
          month: { $month: '$distributionDate' }
        },
        distributions: { $sum: 1 },
        totalValue: { $sum: '$totalValue' },
        totalQuantity: { $sum: '$totalQuantity' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  return {
    overall: stats[0] || {
      totalDistributions: 0,
      totalValue: 0,
      totalQuantity: 0,
      avgValuePerDistribution: 0
    },
    byCategory: categoryStats,
    monthlyTrends: monthlyStats
  };
};

// Create model
const InventoryDistribution = mongoose.model('InventoryDistribution', InventoryDistributionSchema);

export default InventoryDistribution;
