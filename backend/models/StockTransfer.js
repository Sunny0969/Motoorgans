const mongoose = require('mongoose');

const stockTransferItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productCode: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  availableStock: {
    type: Number,
    required: true
  },
  transferQty: {
    type: Number,
    required: true,
    min: 0
  },
  uom: {
    type: String,
    enum: ['PC', 'BOX', 'KG', 'L', 'M'],
    default: 'PC'
  },
  remarks: {
    type: String,
    trim: true
  }
});

const stockTransferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  transferDate: {
    type: Date,
    required: true
  },
  fromLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  toLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  transferredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedBy: {
    type: String,
    trim: true
  },
  vehicleNumber: {
    type: String,
    trim: true
  },
  driverName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  items: [stockTransferItemSchema],
  totalItems: {
    type: Number,
    default: 0
  },
  totalQuantity: {
    type: Number,
    default: 0
  },
  dispatchedAt: {
    type: Date
  },
  receivedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
stockTransferSchema.index({ status: 1 });
stockTransferSchema.index({ fromLocation: 1, toLocation: 1 });
stockTransferSchema.index({ transferDate: -1 });
stockTransferSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate totals
stockTransferSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.transferQty, 0);
  next();
});

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
