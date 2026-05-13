const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  accountTitle: {
    type: String,
    required: true,
    trim: true
  },
  urduTitle: {
    type: String,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['Debtors, Buyers, Customers, Clients', 'Creditors, Suppliers, Vendors', 'Assets', 'Liabilities', 'Income', 'Expenses'],
    required: true
  },
  ledgerNo: {
    type: String,
    trim: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  creditDays: {
    type: Number,
    default: 0
  },
  priceList: {
    type: String,
    enum: ['Whole Sale', 'Retail'],
    default: 'Whole Sale'
  },
  office: {
    type: String,
    default: 'Home'
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phoneNo: {
    type: String,
    trim: true
  },
  cellNo: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  area: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  openingBalance: {
    type: Number,
    default: 0
  },
  balanceDate: {
    type: String,
    default: '29-Mar-22'
  },
  balanceType: {
    type: String,
    enum: ['Receivable', 'Payable'],
    default: 'Receivable'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Legacy fields for compatibility
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense']
  },
  category: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  balance: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Account', accountSchema);
