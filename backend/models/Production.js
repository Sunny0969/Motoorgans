const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  sr: {
    type: Number,
    required: true
  },
  materialCode: {
    type: String,
    trim: true
  },
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Raw Material', 'Component', 'Packaging'],
    trim: true
  },
  requiredQty: {
    type: Number,
    required: true,
    min: 0
  },
  availableStock: {
    type: Number,
    default: 0,
    min: 0
  },
  uom: {
    type: String,
    enum: ['PC', 'MTR', 'KG', 'ROLL'],
    default: 'PC'
  },
  cost: {
    type: Number,
    min: 0
  },
  totalCost: {
    type: Number,
    min: 0
  },
  remarks: {
    type: String,
    trim: true
  }
});

const productSchema = new mongoose.Schema({
  sr: {
    type: Number,
    required: true
  },
  productCode: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Clothing', 'Footwear', 'Accessories'],
    trim: true
  },
  plannedQty: {
    type: Number,
    required: true,
    min: 0
  },
  producedQty: {
    type: Number,
    default: 0,
    min: 0
  },
  uom: {
    type: String,
    enum: ['PC', 'BOX', 'SET'],
    default: 'PC'
  },
  qualityStatus: {
    type: String,
    enum: ['Good', 'Defective', 'Rework'],
    default: 'Good'
  },
  remarks: {
    type: String,
    trim: true
  }
});

const productionSchema = new mongoose.Schema({
  productionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  productionDate: {
    type: Date,
    required: true
  },
  productionOrder: {
    type: String,
    required: true,
    trim: true
  },
  productionLine: {
    type: String,
    required: true,
    trim: true
  },
  supervisor: {
    type: String,
    trim: true
  },
  shift: {
    type: String,
    enum: ['Day', 'Night', 'Evening'],
    default: 'Day'
  },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Paused', 'Completed'],
    default: 'Planned'
  },
  expectedCompletion: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  materials: [materialSchema],
  products: [productSchema],
  summary: {
    totalMaterials: {
      type: Number,
      default: 0
    },
    totalProducts: {
      type: Number,
      default: 0
    },
    totalMaterialCost: {
      type: Number,
      default: 0
    },
    totalProductionQty: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Auto-generate production number if not provided
productionSchema.pre('save', async function(next) {
  if (!this.productionNumber) {
    const today = new Date();
    const year = today.getFullYear();
    const count = await mongoose.model('Production').countDocuments({
      createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });
    this.productionNumber = `PRD-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Production', productionSchema);
