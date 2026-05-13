const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const dayCloseSchema = new mongoose.Schema({
  closeDate: {
    type: Date,
    required: true,
    unique: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening', 'night'],
    required: true
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  cashierDetails: {
    name: String,
    code: String
  },
  openingTime: {
    type: String,
    required: true
  },
  closingTime: {
    type: String,
    required: true
  },

  // Sales Summary
  sales: {
    totalSales: {
      type: Number,
      default: 0,
      min: 0
    },
    cashSales: {
      type: Number,
      default: 0,
      min: 0
    },
    cardSales: {
      type: Number,
      default: 0,
      min: 0
    },
    digitalSales: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTransactions: {
      type: Number,
      default: 0,
      min: 0
    },
    averageTransaction: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Cash Reconciliation
  cashReconciliation: {
    openingBalance: {
      type: Number,
      required: true,
      min: 0
    },
    sales: {
      type: Number,
      default: 0,
      min: 0
    },
    expenses: {
      type: Number,
      default: 0,
      min: 0
    },
    expectedBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    actualBalance: {
      type: Number,
      required: true,
      min: 0
    },
    difference: {
      type: Number,
      default: 0
    }
  },

  // Payment Methods
  payments: {
    cash: {
      total: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 }
    },
    card: {
      total: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 }
    },
    digital: {
      total: { type: Number, default: 0 },
      transactions: { type: Number, default: 0 }
    }
  },

  // Transaction Summary
  transactions: {
    sales: { type: Number, default: 0 },
    returns: { type: Number, default: 0 },
    voids: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 }
  },

  // Expenses
  expenses: {
    total: { type: Number, default: 0 },
    cashExpenses: { type: Number, default: 0 },
    nonCashExpenses: { type: Number, default: 0 },
    categories: [expenseCategorySchema]
  },

  // Verification Status
  verification: {
    cashier: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    },
    manager: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    },
    system: {
      verified: { type: Boolean, default: true },
      verifiedAt: { type: Date, default: Date.now }
    }
  },

  // Status
  status: {
    type: String,
    enum: ['open', 'closing', 'closed', 'reopened'],
    default: 'open'
  },

  // Notes and comments
  notes: {
    type: String,
    trim: true
  },

  // Z-Report data
  zReport: {
    reportNumber: String,
    generatedAt: Date,
    printedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
dayCloseSchema.index({ closeDate: 1, shift: 1 });
dayCloseSchema.index({ cashier: 1 });
dayCloseSchema.index({ status: 1 });

// Virtual for formatted date
dayCloseSchema.virtual('formattedDate').get(function() {
  return this.closeDate.toISOString().split('T')[0];
});

// Pre-save middleware to calculate totals and differences
dayCloseSchema.pre('save', function(next) {
  // Calculate expected balance
  this.cashReconciliation.expectedBalance =
    this.cashReconciliation.openingBalance +
    this.cashReconciliation.sales -
    this.cashReconciliation.expenses;

  // Calculate difference
  this.cashReconciliation.difference =
    this.cashReconciliation.actualBalance - this.cashReconciliation.expectedBalance;

  // Calculate average transaction
  if (this.sales.totalTransactions > 0) {
    this.sales.averageTransaction = this.sales.totalSales / this.sales.totalTransactions;
  }

  next();
});

// Ensure virtual fields are serialized
dayCloseSchema.set('toJSON', { virtuals: true });
dayCloseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DayClose', dayCloseSchema);
