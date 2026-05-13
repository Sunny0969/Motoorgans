const mongoose = require('mongoose');

const clearDataHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['sales', 'products', 'customers', 'transactions', 'inventory', 'backup', 'all']
  },
  actionLabel: {
    type: String,
    required: true
  },
  dateRange: {
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  recordsAffected: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'in_progress'],
    default: 'completed'
  },
  performedBy: {
    type: String,
    default: 'System Admin'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient querying
clearDataHistorySchema.index({ action: 1, timestamp: -1 });
clearDataHistorySchema.index({ timestamp: -1 });

module.exports = mongoose.model('ClearDataHistory', clearDataHistorySchema);
