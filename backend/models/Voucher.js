const mongoose = require('mongoose');

const voucherEntrySchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accountCode: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  debit: {
    type: Number,
    default: 0,
    min: 0
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  }
});

const voucherSchema = new mongoose.Schema({
  voucherNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['Payment', 'Receipt', 'Journal', 'Contra', 'Purchase', 'Sales', 'Credit Note', 'Debit Note'],
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  entries: [voucherEntrySchema],
  totalDebit: {
    type: Number,
    default: 0
  },
  totalCredit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Posted', 'Cancelled'],
    default: 'Draft'
  },
  postedBy: {
    type: String,
    trim: true
  },
  postedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate totals
voucherSchema.pre('save', function(next) {
  this.totalDebit = this.entries.reduce((sum, entry) => sum + entry.debit, 0);
  this.totalCredit = this.entries.reduce((sum, entry) => sum + entry.credit, 0);
  next();
});

module.exports = mongoose.model('Voucher', voucherSchema);
