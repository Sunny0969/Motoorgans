const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  adjustmentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  adjustmentDate: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  adjustmentType: {
    type: String,
    required: true,
    enum: ['Stock Count', 'Damage', 'Theft', 'Expiry', 'Quality Control']
  },
  reason: {
    type: String,
    required: true,
    enum: ['Physical Count Variance', 'Damaged Goods', 'Stock Theft', 'Expired Products', 'Quality Rejection']
  },
  reference: {
    type: String,
    trim: true
  },
  adjustedBy: {
    type: String,
    required: true,
    trim: true
  },
  approvedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Approved', 'Completed'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  totalAdjustmentQty: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockAdjustmentItem'
  }]
}, {
  timestamps: true
});

// Index for efficient querying
stockAdjustmentSchema.index({ status: 1, createdAt: -1 });
stockAdjustmentSchema.index({ location: 1 });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
