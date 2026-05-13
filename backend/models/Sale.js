const mongoose = require('mongoose');

const saleProductSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productCode: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  packing: {
    type: String,
    trim: true
  },
  uom: {
    type: String,
    default: 'PCS'
  },
  pcs: {
    type: Number,
    required: true,
    min: 0
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  discPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  net: {
    type: Number,
    required: true,
    min: 0
  }
});

const saleSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Credit'],
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    trim: true
  },
  customerCode: {
    type: String,
    trim: true
  },
  creditDays: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date
  },
  products: [saleProductSchema],
  totalPcs: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    default: 0
  },
  billAmount: {
    type: Number,
    default: 0
  },
  netPayable: {
    type: Number,
    default: 0
  },
  previousBalance: {
    type: Number,
    default: 0
  },
  cashPaid: {
    type: Number,
    default: 0
  },
  discPercentFooter: {
    type: Number,
    default: 0
  },
  extraDiscount: {
    type: Number,
    default: 0
  },
  transporter: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sendSMS: {
    type: Boolean,
    default: false
  },
  printPreBalance: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Cancelled'],
    default: 'Draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
