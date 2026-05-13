const mongoose = require('mongoose');

const customerGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for customer count
customerGroupSchema.virtual('customerCount').get(function() {
  return this.customers.length;
});

module.exports = mongoose.model('CustomerGroup', customerGroupSchema);
