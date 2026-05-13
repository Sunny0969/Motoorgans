const mongoose = require('mongoose');

const paymentVoucherSchema = new mongoose.Schema({
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
  payee: {
    type: String,
    required: true,
    trim: true
  },
  account: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Check', 'Bank Transfer', 'Credit Card', 'Digital Payment']
  },
  reference: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: String,
    trim: true
  },
  preparedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-generate voucher number if not provided
paymentVoucherSchema.pre('save', async function(next) {
  if (!this.voucherNo) {
    const today = new Date();
    const year = today.getFullYear();
    const count = await mongoose.model('PaymentVoucher').countDocuments({
      createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });
    this.voucherNo = `PV-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentVoucher', paymentVoucherSchema);
