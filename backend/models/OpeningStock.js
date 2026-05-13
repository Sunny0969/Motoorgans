const mongoose = require('mongoose');

const openingStockProductSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  uom: {
    type: String,
    default: 'PC',
    trim: true
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  }
});

const openingStockSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  fiscalYear: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  products: [openingStockProductSchema],
  summary: {
    totalItems: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate summary before saving
openingStockSchema.pre('save', function(next) {
  const totalItems = this.products.length;
  const totalQuantity = this.products.reduce((sum, product) => sum + (product.quantity || 0), 0);
  const totalValue = this.products.reduce((sum, product) => sum + (product.totalValue || 0), 0);

  this.summary = {
    totalItems,
    totalQuantity,
    totalValue
  };

  next();
});

module.exports = mongoose.model('OpeningStock', openingStockSchema);
