const mongoose = require('mongoose');

const groupAccountLevelSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  parentGroup: {
    type: String,
    required: true,
    enum: ['Assets', 'Liabilities', 'Equity', 'Income', 'Expenses']
  },
  level: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Index for better query performance
groupAccountLevelSchema.index({ parentGroup: 1, level: 1 });

module.exports = mongoose.model('GroupAccountLevel', groupAccountLevelSchema);
