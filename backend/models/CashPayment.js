const mongoose = require('mongoose');

const cashPaymentSchema = new mongoose.Schema({
  cpvNumber: {
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
  amount: {
    type: Number,
    required: true,
    min: 0
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

module.exports = mongoose.model('CashPayment', cashPaymentSchema);
