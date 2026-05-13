const mongoose = require('mongoose');

const demandOrderItemSchema = new mongoose.Schema({
  sr: {
    type: Number,
    required: true
  },
  productCode: {
    type: String,
    trim: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  requiredQty: {
    type: Number,
    required: true,
    min: 0
  },
  uom: {
    type: String,
    enum: ['PC', 'BOX', 'KG', 'LTR'],
    default: 'PC'
  },
  remarks: {
    type: String,
    trim: true
  }
});

const demandOrderSchema = new mongoose.Schema({
  demandNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  requiredDate: {
    type: Date,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  requestedByDetails: {
    name: String,
    code: String
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  fromLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  fromLocationDetails: {
    name: String,
    code: String
  },
  toLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  },
  toLocationDetails: {
    name: String,
    code: String
  },
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  items: [demandOrderItemSchema],

  // Summary calculations
  summary: {
    totalItems: {
      type: Number,
      default: 0
    },
    totalQuantity: {
      type: Number,
      default: 0
    }
  },

  // Approval workflow
  approvals: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    approvedByDetails: {
      name: String,
      code: String
    },
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    rejectedByDetails: {
      name: String,
      code: String
    },
    rejectedAt: Date,
    rejectionReason: String
  },

  // Additional metadata
  notes: {
    type: String,
    trim: true
  },

  // Reference to related documents
  relatedPurchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase'
  },

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
demandOrderSchema.index({ date: -1 });
demandOrderSchema.index({ requiredDate: -1 });
demandOrderSchema.index({ requestedBy: 1 });
demandOrderSchema.index({ status: 1 });
demandOrderSchema.index({ priority: 1 });
demandOrderSchema.index({ fromLocation: 1 });
demandOrderSchema.index({ toLocation: 1 });

// Pre-save middleware to calculate summary
demandOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.summary.totalItems = this.items.length;
    this.summary.totalQuantity = this.items.reduce((sum, item) => sum + (item.requiredQty || 0), 0);
  } else {
    this.summary.totalItems = 0;
    this.summary.totalQuantity = 0;
  }
  next();
});

// Virtual for formatted demand number
demandOrderSchema.virtual('formattedDemandNumber').get(function() {
  return this.demandNumber;
});

// Ensure virtual fields are serialized
demandOrderSchema.set('toJSON', { virtuals: true });
demandOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DemandOrder', demandOrderSchema);
