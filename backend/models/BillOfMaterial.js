const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  }
});

const billOfMaterialSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true
  },
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  components: [componentSchema],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Calculate total cost before saving
billOfMaterialSchema.pre('save', function(next) {
  if (this.components && this.components.length > 0) {
    this.cost = this.components.reduce((total, component) => {
      return total + (component.quantity * component.cost);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('BillOfMaterial', billOfMaterialSchema);
