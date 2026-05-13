const mongoose = require('mongoose');

const financialStatementLevelSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinancialStatementLevel'
  },
  level: {
    type: Number,
    required: true,
    min: 1
  },
  type: {
    type: String,
    required: true,
    enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
financialStatementLevelSchema.index({ parent: 1 });
financialStatementLevelSchema.index({ level: 1 });
financialStatementLevelSchema.index({ type: 1 });

module.exports = mongoose.model('FinancialStatementLevel', financialStatementLevelSchema);
