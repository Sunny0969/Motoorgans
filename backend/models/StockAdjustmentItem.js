const mongoose = require('mongoose');

const stockAdjustmentItemSchema = new mongoose.Schema({
  stockAdjustment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockAdjustment',
    required: true
  },
  productCode: {
    type: String,
    required: true,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  adjustmentQty: {
    type: Number,
    required: true
  },
  uom: {
    type: String,
    default: 'PC',
    trim: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  remarks: {
    type: String,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
}, {
  timestamps: true
});

// Index for efficient querying
stockAdjustmentItemSchema.index({ stockAdjustment: 1 });
stockAdjustmentItemSchema.index({ productCode: 1 });

module.exports = mongoose.model('StockAdjustmentItem', stockAdjustmentItemSchema);
