const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productSku: {
    type: String,
    required: true
  },
  movementType: {
    type: String,
    enum: ['sale', 'purchase', 'return', 'adjustment', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  costPrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  reference: {
    type: String,
    trim: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Sale', 'Purchase', 'StockAdjustment']
  },
  notes: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ reference: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
