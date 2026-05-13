const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    trim: true
  }
});

const bankReceiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  receiptDate: {
    type: Date,
    required: true
  },
  bankAccount: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['Deposit', 'Withdrawal', 'Transfer'],
    default: 'Deposit'
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ['Cash', 'Cheque', 'Transfer'],
    default: 'Cash'
  },
  chequeNumber: {
    type: String,
    trim: true
  },
  chequeDate: {
    type: Date
  },
  customer: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
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
  narration: {
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
    enum: ['Draft', 'Submitted', 'Approved', 'Posted'],
    default: 'Draft'
  },
  reference: {
    type: String,
    trim: true
  },
  items: [receiptItemSchema],
  summary: {
    totalItems: {
      type: Number,
      default: 0
    },
    subTotal: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BankReceipt', bankReceiptSchema);
