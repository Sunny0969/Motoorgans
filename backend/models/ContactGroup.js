const mongoose = require('mongoose');

const contactGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3498db'
  },
  contacts: [{
    type: mongoose.Schema.Types.ObjectId,
    // Can reference different models like Customer, Supplier, Employee
    // For now, leaving as generic ObjectId
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for contact count
contactGroupSchema.virtual('contactCount').get(function() {
  return this.contacts.length;
});

// Ensure virtual fields are serialized
contactGroupSchema.set('toJSON', { virtuals: true });
contactGroupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ContactGroup', contactGroupSchema);
