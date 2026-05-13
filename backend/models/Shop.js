const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['Retail', 'Wholesale', 'Online', 'Kiosk'],
    default: 'Retail'
  },
  address: {
    type: String,
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  manager: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  openingDate: {
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

module.exports = mongoose.model('Shop', shopSchema);
