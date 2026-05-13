const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Inventory', 'Maintenance', 'Marketing', 'Other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque', 'Digital Wallet']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    default: ''
  },
  receiptNo: {
    type: String,
    required: true
  },
  vendor: {
    type: String,
    default: ''
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totalAmount
expenseSchema.pre('save', function(next) {
  this.totalAmount = this.amount + this.taxAmount;
  next();
});

// Pre-update middleware for findOneAndUpdate
expenseSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.amount !== undefined || update.taxAmount !== undefined) {
    const amount = update.amount !== undefined ? update.amount : this.getQuery().amount;
    const taxAmount = update.taxAmount !== undefined ? update.taxAmount : this.getQuery().taxAmount;
    update.totalAmount = amount + taxAmount;
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
