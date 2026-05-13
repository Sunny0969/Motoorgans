const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    trim: true
  },
  invoiceDate: {
    type: String,
    trim: true
  },
  dueDate: {
    type: String,
    trim: true
  },
  originalAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  allocatedAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  }
});

const bankPaymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paidTo: {
    type: String,
    required: true,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  bankAccount: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Bank Transfer', 'Cheque', 'Online Transfer', 'Wire Transfer'],
    default: 'Bank Transfer'
  },
  chequeNumber: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['Draft', 'Processed', 'Cleared'],
    default: 'Draft'
  },
  preparedBy: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  allocations: [allocationSchema],
  summary: {
    totalAllocated: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BankPayment', bankPaymentSchema);
