const mongoose = require('mongoose');

const transactionClassSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    trim: true,
    uppercase: true,
    maxlength: [10, 'Code cannot exceed 10 characters'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['Income', 'Expense', 'Balance Sheet', 'Other'],
      message: 'Category must be one of: Income, Expense, Balance Sheet, Other'
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Index for efficient searching
transactionClassSchema.index({ className: 1 });
transactionClassSchema.index({ category: 1 });
transactionClassSchema.index({ status: 1 });

// Virtual for id
transactionClassSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialised
transactionClassSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('TransactionClass', transactionClassSchema);
