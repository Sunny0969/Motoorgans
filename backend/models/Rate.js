const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Clothing', 'Footwear', 'Raw Material'],
    trim: true
  },
  uom: {
    type: String,
    required: true,
    enum: ['PC', 'MTR', 'KG', 'BOX'],
    default: 'PC'
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  minPrice: {
    type: Number,
    min: 0
  },
  maxPrice: {
    type: Number,
    min: 0
  },
  effectiveDate: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
rateSchema.index({ category: 1, status: 1 });
rateSchema.index({ itemName: 1 });

module.exports = mongoose.model('Rate', rateSchema);
