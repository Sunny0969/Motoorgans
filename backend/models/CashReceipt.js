const mongoose = require('mongoose');

const cashReceiptSchema = new mongoose.Schema({
  crvNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  code: {
    type: String,
    trim: true
  },
  accountTitle: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  invoice: {
    type: String,
    trim: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    type: String,
    trim: true
  },
  updateTime: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Cancelled'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CashReceipt', cashReceiptSchema);
