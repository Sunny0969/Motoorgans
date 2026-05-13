const mongoose = require('mongoose');

const saleOrderProductSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true
  },
  product: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  qty: {
    type: Number,
    required: true,
    min: 0
  },
  uom: {
    type: String,
    required: true,
    trim: true
  },
  pc: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amt: {
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
  disc: {
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

const saleOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerDetails: {
    code: String,
    phone: String,
    address: String,
    location: String
  },
  salesPerson: {
    type: String,
    trim: true
  },
  products: [saleOrderProductSchema],
  totals: {
    quantity: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    net: {
      type: Number,
      default: 0
    }
  },
  advancedPayment: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'draft'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for order number with prefix
saleOrderSchema.virtual('formattedOrderNumber').get(function() {
  return `SO-${this.orderNumber}`;
});

// Ensure virtual fields are serialized
saleOrderSchema.set('toJSON', { virtuals: true });
saleOrderSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate totals
saleOrderSchema.pre('save', function(next) {
  const totals = this.products.reduce((acc, product) => {
    acc.quantity += product.qty;
    acc.amount += product.amt;
    acc.discount += product.disc;
    acc.net += product.net;
    return acc;
  }, { quantity: 0, amount: 0, discount: 0, net: 0 });

  this.totals = totals;
  this.remainingAmount = totals.net - this.advancedPayment;

  next();
});

module.exports = mongoose.model('SaleOrder', saleOrderSchema);
