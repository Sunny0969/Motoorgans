const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    enum: ['Sales', 'Management', 'Inventory', 'Customer Service', 'Administration', 'Other'],
    required: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  hireDate: {
    type: Date
  },
  salary: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  },
  location: {
    type: String,
    enum: ['Main Store', 'Warehouse', 'Branch Office', 'Online'],
    default: 'Main Store'
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate fullName
employeeSchema.pre('save', function(next) {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
