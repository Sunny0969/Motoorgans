const mongoose = require('mongoose');

const claimOutToSupplierSchema = new mongoose.Schema({
  claimNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    required: true
  },
  claimDate: {
    type: String,
    required: true
  },
  originalPurchase: {
    type: String,
    required: true
  },
  supplier: {
    type: String,
    required: true
  },
  supplierInvoice: {
    type: String
  },
  claimType: {
    type: String,
    required: true
  },
  claimReason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  warehouse: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Acknowledged', 'Under Investigation', 'Approved by Supplier', 'Rejected by Supplier', 'Settled', 'Closed'],
    default: 'Draft'
  },
  followUpDate: {
    type: String
  },
  items: [{
    itemCode: String,
    itemName: {
      type: String,
      required: true
    },
    batchNumber: String,
    originalQty: {
      type: Number,
      default: 0
    },
    claimedQty: {
      type: Number,
      required: true
    },
    uom: {
      type: String,
      default: 'PC'
    },
    unitCost: {
      type: Number,
      required: true
    },
    claimAmount: {
      type: Number,
      required: true
    },
    defectType: {
      type: String,
      enum: ['Critical', 'Major', 'Minor']
    },
    evidenceRef: String
  }],
  summary: {
    totalItems: {
      type: Number,
      default: 0
    },
    totalClaimedQty: {
      type: Number,
      default: 0
    },
    totalClaimAmount: {
      type: Number,
      default: 0
    },
    settlementAmount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClaimOutToSupplier', claimOutToSupplierSchema);
