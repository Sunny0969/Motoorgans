const mongoose = require('mongoose');

const invoiceEntrySchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
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
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentAmount: {
    type: Number,
    required: true,
    default: 0
  },
  remarks: {
    type: String,
    trim: true
  }
});

const chequeTransferSchema = new mongoose.Schema({
  transferNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  transferDate: {
    type: String,
    required: true,
    trim: true
  },
  transferType: {
    type: String,
    enum: ['Supplier Payment', 'Expense Payment', 'Salary Payment', 'Advance Payment', 'Other Payment'],
    required: true,
    default: 'Supplier Payment'
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  bankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  chequeNumber: {
    type: String,
    required: true,
    trim: true
  },
  chequeDate: {
    type: String,
    required: true,
    trim: true
  },
  payeeName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  reference: {
    type: String,
    trim: true
  },
  preparedBy: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Approved', 'Cheque Issued', 'Cheque Delivered', 'Cleared'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  invoices: [invoiceEntrySchema],
  summary: {
    totalInvoices: {
      type: Number,
      default: 0
    },
    totalPaymentAmount: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chequeTransferSchema.index({ supplier: 1 });
chequeTransferSchema.index({ bankAccount: 1 });
chequeTransferSchema.index({ status: 1 });
chequeTransferSchema.index({ transferDate: 1 });

module.exports = mongoose.model('ChequeTransfer', chequeTransferSchema);
