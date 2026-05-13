const mongoose = require('mongoose');

const claimInFromCustomerSchema = new mongoose.Schema({
  claimNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  claimDate: {
    type: Date,
    required: true
  },
  originalSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerReference: {
    type: String,
    trim: true
  },
  claimType: {
    type: String,
    enum: ['Product Defect', 'Wrong Item', 'Damaged in Transit'],
    required: true
  },
  claimReason: {
    type: String,
    enum: ['Manufacturing Defect', 'Shipping Damage', 'Wrong Size/Color']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  receivedBy: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Received', 'Under Inspection', 'Approved', 'Rejected', 'Refund Processed', 'Replaced', 'Closed'],
    default: 'Received'
  },
  resolution: {
    type: String,
    enum: ['Refund', 'Replace', 'Repair']
  },
  notes: {
    type: String,
    trim: true
  },
  items: [{
    itemCode: {
      type: String,
      trim: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    batchNumber: {
      type: String,
      trim: true
    },
    soldQty: {
      type: Number,
      default: 0
    },
    returnedQty: {
      type: Number,
      required: true
    },
    uom: {
      type: String,
      default: 'PC',
      trim: true
    },
    unitPrice: {
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
    condition: {
      type: String,
      enum: ['Damaged', 'Used', 'Like New']
    },
    inspectionDate: {
      type: Date
    },
    evidenceRef: {
      type: String,
      trim: true
    },
    action: {
      type: String,
      enum: ['Refund', 'Replace', 'Repair', 'Scrap']
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  summary: {
    totalItems: {
      type: Number,
      default: 0
    },
    totalReturnedQty: {
      type: Number,
      default: 0
    },
    totalClaimAmount: {
      type: Number,
      default: 0
    },
    refundAmount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ClaimInFromCustomer', claimInFromCustomerSchema);
