const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  uom: {
    type: String,
    default: 'PCS',
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
